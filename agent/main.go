package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	_ "github.com/jackc/pgx/v4/stdlib"
	"github.com/joho/godotenv"
	"gopkg.in/gomail.v2"
)

type Application struct {
	ID        int
	PublicURL string
	Online    bool
}

type Notification struct {
	ID             int
	Enabled        bool
	Type           string
	SMTPHost       sql.NullString
	SMTPPort       sql.NullInt64
	SMTPFrom       sql.NullString
	SMTPUser       sql.NullString
	SMTPPass       sql.NullString
	SMTPSecure     sql.NullBool
	SMTPTo         sql.NullString
	TelegramChatID sql.NullString
	TelegramToken  sql.NullString
	DiscordWebhook sql.NullString
}

var (
	notifications []Notification
	notifMutex    sync.RWMutex
)

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("No env vars found")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		panic("DATABASE_URL not set")
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		panic(fmt.Sprintf("Database connection failed: %v\n", err))
	}
	defer db.Close()

	// initial load
	notifs, err := loadNotifications(db)
	if err != nil {
		panic(fmt.Sprintf("Failed to load notifications: %v", err))
	}
	notifMutex.Lock()
	notifications = notifMutexCopy(notifs)
	notifMutex.Unlock()

	// reload notification configs every minute
	go func() {
		reloadTicker := time.NewTicker(time.Minute)
		defer reloadTicker.Stop()

		for range reloadTicker.C {
			newNotifs, err := loadNotifications(db)
			if err != nil {
				fmt.Printf("Failed to reload notifications: %v\n", err)
				continue
			}
			notifMutex.Lock()
			notifications = notifMutexCopy(newNotifs)
			notifMutex.Unlock()
			fmt.Println("Reloaded notification configurations")
		}
	}()

	// clean up old entries hourly
	go func() {
		deletionTicker := time.NewTicker(time.Hour)
		defer deletionTicker.Stop()

		for range deletionTicker.C {
			if err := deleteOldEntries(db); err != nil {
				fmt.Printf("Error deleting old entries: %v\n", err)
			}
		}
	}()

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	client := &http.Client{
		Timeout: 4 * time.Second,
	}

	for now := range ticker.C {
		if now.Second()%10 != 0 {
			continue
		}

		apps := getApplications(db)
		checkAndUpdateStatus(db, client, apps)
	}
}

// helper to safely copy slice
func notifMutexCopy(src []Notification) []Notification {
	copyDst := make([]Notification, len(src))
	copy(copyDst, src)
	return copyDst
}

func loadNotifications(db *sql.DB) ([]Notification, error) {
	rows, err := db.Query(
		`SELECT id, enabled, type, "smtpHost", "smtpPort", "smtpFrom", "smtpUser", "smtpPass", "smtpSecure", "smtpTo",
		       "telegramChatId", "telegramToken", "discordWebhook"
		FROM notification
		WHERE enabled = true`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(
			&n.ID, &n.Enabled, &n.Type,
			&n.SMTPHost, &n.SMTPPort, &n.SMTPFrom, &n.SMTPUser, &n.SMTPPass, &n.SMTPSecure, &n.SMTPTo,
			&n.TelegramChatID, &n.TelegramToken, &n.DiscordWebhook,
		); err != nil {
			fmt.Printf("Error scanning notification: %v\n", err)
			continue
		}
		configs = append(configs, n)
	}
	return configs, nil
}

func deleteOldEntries(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	res, err := db.ExecContext(ctx,
		`DELETE FROM uptime_history WHERE "createdAt" < now() - interval '30 days'`,
	)
	if err != nil {
		return err
	}
	affected, _ := res.RowsAffected()
	fmt.Printf("Deleted %d old entries from uptime_history\n", affected)
	return nil
}

func getApplications(db *sql.DB) []Application {
	rows, err := db.Query(
		`SELECT id, "publicURL", online FROM application WHERE "publicURL" IS NOT NULL`,
	)
	if err != nil {
		fmt.Printf("Error fetching applications: %v\n", err)
		return nil
	}
	defer rows.Close()

	var apps []Application
	for rows.Next() {
		var app Application
		if err := rows.Scan(&app.ID, &app.PublicURL, &app.Online); err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			continue
		}
		apps = append(apps, app)
	}
	return apps
}

func checkAndUpdateStatus(db *sql.DB, client *http.Client, apps []Application) {
	for _, app := range apps {
		// HTTP request context
		httpCtx, httpCancel := context.WithTimeout(context.Background(), 4*time.Second)
		defer httpCancel()

		req, err := http.NewRequestWithContext(httpCtx, "GET", app.PublicURL, nil)
		if err != nil {
			fmt.Printf("Error creating request: %v\n", err)
			continue
		}

		resp, err := client.Do(req)
		isOnline := (err == nil && resp.StatusCode >= 200 && resp.StatusCode < 300) || resp.StatusCode == 405

		// Notify on status change
		if isOnline != app.Online {
			status := "offline"
			if isOnline {
				status = "online"
			}
			message := fmt.Sprintf("Application %d (%s) is now %s", app.ID, app.PublicURL, status)
			sendNotifications(message)
		}

		// DB context
		dbCtx, dbCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer dbCancel()

		// Update application status
		_, err = db.ExecContext(dbCtx,
			`UPDATE application SET online = $1 WHERE id = $2`,
			isOnline, app.ID,
		)
		if err != nil {
			fmt.Printf("Update failed for app %d: %v\n", app.ID, err)
		}

		// Insert into uptime_history
		_, err = db.ExecContext(dbCtx,
			`INSERT INTO uptime_history ("applicationId", online, "createdAt") VALUES ($1, $2, now())`,
			app.ID, isOnline,
		)
		if err != nil {
			fmt.Printf("Insert into uptime_history failed for app %d: %v\n", app.ID, err)
		}
	}
}

func sendNotifications(message string) {
	notifMutex.RLock()
	notifs := notifMutexCopy(notifications)
	notifMutex.RUnlock()

	for _, n := range notifs {
		switch n.Type {
		case "email":
			if n.SMTPHost.Valid && n.SMTPTo.Valid {
				sendEmail(n, message)
			}
		case "telegram":
			if n.TelegramToken.Valid && n.TelegramChatID.Valid {
				sendTelegram(n, message)
			}
		case "discord":
			if n.DiscordWebhook.Valid {
				sendDiscord(n, message)
			}
		}
	}
}

func sendEmail(n Notification, body string) {
	// Initialize SMTP dialer with host, port, user, pass
	d := gomail.NewDialer(
		n.SMTPHost.String,
		int(n.SMTPPort.Int64),
		n.SMTPUser.String,
		n.SMTPPass.String,
	)
	if n.SMTPSecure.Valid && n.SMTPSecure.Bool {
		d.SSL = true
	}

	m := gomail.NewMessage()
	m.SetHeader("From", n.SMTPFrom.String)
	m.SetHeader("To", n.SMTPTo.String)
	m.SetHeader("Subject", "Uptime Notification")
	m.SetBody("text/plain", body)

	if err := d.DialAndSend(m); err != nil {
		fmt.Printf("Email send failed: %v\n", err)
	}
}

func sendTelegram(n Notification, message string) {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage?chat_id=%s&text=%s",
		n.TelegramToken.String,
		n.TelegramChatID.String,
		message,
	)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("Telegram send failed: %v\n", err)
		return
	}
	resp.Body.Close()
}

func sendDiscord(n Notification, message string) {
	payload := fmt.Sprintf(`{"content": "%s"}`, message)
	req, err := http.NewRequest("POST", n.DiscordWebhook.String, strings.NewReader(payload))
	if err != nil {
		fmt.Printf("Discord request creation failed: %v\n", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Discord send failed: %v\n", err)
		return
	}
	resp.Body.Close()
}
