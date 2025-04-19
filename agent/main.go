package main

import (
	"bytes"
	"context"
	"crypto/x509"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
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
	Name      string
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
	GotifyUrl      sql.NullString
	GotifyToken    sql.NullString
	NtfyUrl        sql.NullString
	NtfyToken      sql.NullString
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

func isIPAddress(host string) bool {
	ip := net.ParseIP(host)
	return ip != nil
}

func loadNotifications(db *sql.DB) ([]Notification, error) {
	rows, err := db.Query(
		`SELECT id, enabled, type, "smtpHost", "smtpPort", "smtpFrom", "smtpUser", "smtpPass", "smtpSecure", "smtpTo",
		       "telegramChatId", "telegramToken", "discordWebhook", "gotifyUrl", "gotifyToken", "ntfyUrl", "ntfyToken"
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
			&n.TelegramChatID, &n.TelegramToken, &n.DiscordWebhook, &n.GotifyUrl, &n.GotifyToken, &n.NtfyUrl, &n.NtfyToken,
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
		`SELECT id, name, "publicURL", online FROM application WHERE "publicURL" IS NOT NULL`,
	)
	if err != nil {
		fmt.Printf("Error fetching applications: %v\n", err)
		return nil
	}
	defer rows.Close()

	var apps []Application
	for rows.Next() {
		var app Application
		if err := rows.Scan(&app.ID, &app.Name, &app.PublicURL, &app.Online); err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			continue
		}
		apps = append(apps, app)
	}
	return apps
}

func checkAndUpdateStatus(db *sql.DB, client *http.Client, apps []Application) {
	var notificationTemplate string
	err := db.QueryRow("SELECT notification_text FROM settings LIMIT 1").Scan(&notificationTemplate)
	if err != nil || notificationTemplate == "" {
		notificationTemplate = "The application !name (!url) went !status!"
	}

	for _, app := range apps {
		logPrefix := fmt.Sprintf("[App %s (%s)]", app.Name, app.PublicURL)
		fmt.Printf("%s Checking...\n", logPrefix)

		parsedURL, parseErr := url.Parse(app.PublicURL)
		if parseErr != nil {
			fmt.Printf("%s Invalid URL: %v\n", logPrefix, parseErr)
			continue
		}

		hostIsIP := isIPAddress(parsedURL.Hostname())

		httpCtx, httpCancel := context.WithTimeout(context.Background(), 4*time.Second)
		req, err := http.NewRequestWithContext(httpCtx, "HEAD", app.PublicURL, nil)
		if err != nil {
			fmt.Printf("%s Request creation failed: %v\n", logPrefix, err)
			httpCancel()
			continue
		}

		resp, err := client.Do(req)

		if err != nil || (resp != nil && (resp.StatusCode == http.StatusMethodNotAllowed || resp.StatusCode == http.StatusNotImplemented)) {
			if resp != nil && resp.Body != nil {
				resp.Body.Close()
			}
			fmt.Printf("%s HEAD failed, trying GET...\n", logPrefix)

			req.Method = "GET"
			resp, err = client.Do(req)
		}

		var isOnline bool
		if err == nil && resp != nil {
			isOnline = (resp.StatusCode >= 200 && resp.StatusCode < 300) || resp.StatusCode == 405
			resp.Body.Close()
		} else {
			if err != nil {
				fmt.Printf("%s HTTP error: %v\n", logPrefix, err)

				// Sonderbehandlung für IP-Adressen + TLS-Zertifikatfehler
				if hostIsIP {
					var urlErr *url.Error
					if errors.As(err, &urlErr) {
						var certErr x509.HostnameError
						var unknownAuthErr x509.UnknownAuthorityError
						if errors.As(urlErr.Err, &certErr) || errors.As(urlErr.Err, &unknownAuthErr) {
							fmt.Printf("%s Ignoring TLS error for IP, marking as online.\n", logPrefix)
							isOnline = true
						}
					}
				}
			}
		}

		httpCancel()

		if isOnline != app.Online {
			status := "offline"
			if isOnline {
				status = "online"
			}

			message := notificationTemplate
			message = strings.ReplaceAll(message, "!name", app.Name)
			message = strings.ReplaceAll(message, "!url", app.PublicURL)
			message = strings.ReplaceAll(message, "!status", status)

			sendNotifications(message)
		}

		dbCtx, dbCancel := context.WithTimeout(context.Background(), 5*time.Second)
		_, err = db.ExecContext(dbCtx,
			`UPDATE application SET online = $1 WHERE id = $2`,
			isOnline, app.ID,
		)
		if err != nil {
			fmt.Printf("%s DB update failed: %v\n", logPrefix, err)
		}
		dbCancel()

		dbCtx2, dbCancel2 := context.WithTimeout(context.Background(), 5*time.Second)
		_, err = db.ExecContext(dbCtx2,
			`INSERT INTO uptime_history("applicationId", online, "createdAt") VALUES ($1, $2, now())`,
			app.ID, isOnline,
		)
		if err != nil {
			fmt.Printf("%s Insert into history failed: %v\n", logPrefix, err)
		}
		dbCancel2()
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
		case "gotify":
			if n.GotifyUrl.Valid && n.GotifyToken.Valid {
				sendGotify(n, message)
			}
		case "ntfy":
			if n.NtfyUrl.Valid && n.NtfyToken.Valid {
				sendNtfy(n, message)
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

func sendGotify(n Notification, message string) {
	baseURL := strings.TrimSuffix(n.GotifyUrl.String, "/")
	targetURL := fmt.Sprintf("%s/message", baseURL)

	form := url.Values{}
	form.Add("message", message)
	form.Add("priority", "5")

	req, err := http.NewRequest("POST", targetURL, strings.NewReader(form.Encode()))
	if err != nil {
		fmt.Printf("Gotify: ERROR creating request: %v\n", err)
		return
	}

	req.Header.Set("X-Gotify-Key", n.GotifyToken.String)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Gotify: ERROR sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Gotify: ERROR status code: %d\n", resp.StatusCode)
	}
}

func sendNtfy(n Notification, message string) {
	baseURL := strings.TrimSuffix(n.NtfyUrl.String, "/")
	topic := "corecontrol"
	requestURL := fmt.Sprintf("%s/%s", baseURL, topic)

	payload := map[string]string{"message": message}
	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Printf("Ntfy: ERROR marshaling JSON: %v\n", err)
		return
	}

	req, err := http.NewRequest("POST", requestURL, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Ntfy: ERROR creating request: %v\n", err)
		return
	}

	if n.NtfyToken.Valid {
		req.Header.Set("Authorization", "Bearer "+n.NtfyToken.String)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Ntfy: ERROR sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Ntfy: ERROR status code: %d\n", resp.StatusCode)
	}
}
