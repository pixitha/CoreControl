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

type Server struct {
	ID            int
	Name          string
	Monitoring    bool
	MonitoringURL sql.NullString
	Online        bool
	CpuUsage      sql.NullFloat64
	RamUsage      sql.NullFloat64
	DiskUsage     sql.NullFloat64
}

type CPUResponse struct {
	Total float64 `json:"total"`
}

type MemoryResponse struct {
	Active    int64   `json:"active"`
	Available int64   `json:"available"`
	Buffers   int64   `json:"buffers"`
	Cached    int64   `json:"cached"`
	Free      int64   `json:"free"`
	Inactive  int64   `json:"inactive"`
	Percent   float64 `json:"percent"`
	Shared    int64   `json:"shared"`
	Total     int64   `json:"total"`
	Used      int64   `json:"used"`
}

type FSResponse []struct {
	DeviceName string  `json:"device_name"`
	MntPoint   string  `json:"mnt_point"`
	Percent    float64 `json:"percent"`
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
	PushoverUrl    sql.NullString
	PushoverToken  sql.NullString
	PushoverUser   sql.NullString
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

	// Check for test notifications every 10 seconds
	go func() {
		testNotifTicker := time.NewTicker(10 * time.Second)
		defer testNotifTicker.Stop()

		for range testNotifTicker.C {
			checkAndSendTestNotifications(db)
		}
	}()

	appClient := &http.Client{
		Timeout: 4 * time.Second,
	}

	// Server monitoring every 5 seconds
	go func() {
		serverClient := &http.Client{
			Timeout: 5 * time.Second,
		}
		serverTicker := time.NewTicker(5 * time.Second)
		defer serverTicker.Stop()

		for range serverTicker.C {
			servers := getServers(db)
			checkAndUpdateServerStatus(db, serverClient, servers)
		}
	}()

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for now := range ticker.C {
		if now.Second()%10 != 0 {
			continue
		}

		apps := getApplications(db)
		checkAndUpdateStatus(db, appClient, apps)
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

	// Delete old uptime history entries
	res, err := db.ExecContext(ctx,
		`DELETE FROM uptime_history WHERE "createdAt" < now() - interval '30 days'`,
	)
	if err != nil {
		return err
	}
	affected, _ := res.RowsAffected()
	fmt.Printf("Deleted %d old entries from uptime_history\n", affected)

	// Delete old server history entries
	res, err = db.ExecContext(ctx,
		`DELETE FROM server_history WHERE "createdAt" < now() - interval '30 days'`,
	)
	if err != nil {
		return err
	}
	affected, _ = res.RowsAffected()
	fmt.Printf("Deleted %d old entries from server_history\n", affected)

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

func getServers(db *sql.DB) []Server {
	rows, err := db.Query(
		`SELECT id, name, monitoring, "monitoringURL", online, "cpuUsage", "ramUsage", "diskUsage" 
         FROM server WHERE monitoring = true`,
	)
	if err != nil {
		fmt.Printf("Error fetching servers: %v\n", err)
		return nil
	}
	defer rows.Close()

	var servers []Server
	for rows.Next() {
		var server Server
		if err := rows.Scan(
			&server.ID, &server.Name, &server.Monitoring, &server.MonitoringURL,
			&server.Online, &server.CpuUsage, &server.RamUsage, &server.DiskUsage,
		); err != nil {
			fmt.Printf("Error scanning server row: %v\n", err)
			continue
		}
		servers = append(servers, server)
	}
	return servers
}

func checkAndUpdateStatus(db *sql.DB, client *http.Client, apps []Application) {
	var notificationTemplate string
	err := db.QueryRow("SELECT notification_text_application FROM settings LIMIT 1").Scan(&notificationTemplate)
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
		var isOnline bool

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		req, err := http.NewRequestWithContext(ctx, "GET", app.PublicURL, nil)
		if err != nil {
			fmt.Printf("%s Request creation failed: %v\n", logPrefix, err)
			continue
		}

		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			isOnline = resp.StatusCode >= 200 && resp.StatusCode < 400
			fmt.Printf("%s Response status: %d\n", logPrefix, resp.StatusCode)
		} else {
			fmt.Printf("%s Connection error: %v\n", logPrefix, err)

			if hostIsIP {
				var urlErr *url.Error
				if errors.As(err, &urlErr) {
					var certErr x509.HostnameError
					var unknownAuthErr x509.UnknownAuthorityError
					if errors.As(urlErr.Err, &certErr) || errors.As(urlErr.Err, &unknownAuthErr) {
						fmt.Printf("%s Ignoring TLS error for IP, marking as online\n", logPrefix)
						isOnline = true
					}
				}
			}
		}

		if isOnline != app.Online {
			status := "offline"
			if isOnline {
				status = "online"
			}

			message := strings.ReplaceAll(notificationTemplate, "!name", app.Name)
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
			fmt.Printf("%s History insert failed: %v\n", logPrefix, err)
		}
		dbCancel2()
	}
}

func checkAndUpdateServerStatus(db *sql.DB, client *http.Client, servers []Server) {
	var notificationTemplate string
	err := db.QueryRow("SELECT notification_text_server FROM settings LIMIT 1").Scan(&notificationTemplate)
	if err != nil || notificationTemplate == "" {
		notificationTemplate = "The server !name is now !status!"
	}

	for _, server := range servers {
		if !server.Monitoring || !server.MonitoringURL.Valid {
			continue
		}

		logPrefix := fmt.Sprintf("[Server %s]", server.Name)
		fmt.Printf("%s Checking...\n", logPrefix)

		baseURL := strings.TrimSuffix(server.MonitoringURL.String, "/")
		var cpuUsage, ramUsage, diskUsage float64
		var online = true

		// Get CPU usage
		cpuResp, err := client.Get(fmt.Sprintf("%s/api/4/cpu", baseURL))
		if err != nil {
			fmt.Printf("%s CPU request failed: %v\n", logPrefix, err)
			updateServerStatus(db, server.ID, false, 0, 0, 0)
			online = false
		} else {
			defer cpuResp.Body.Close()

			if cpuResp.StatusCode != http.StatusOK {
				fmt.Printf("%s Bad CPU status code: %d\n", logPrefix, cpuResp.StatusCode)
				updateServerStatus(db, server.ID, false, 0, 0, 0)
				online = false
			} else {
				var cpuData CPUResponse
				if err := json.NewDecoder(cpuResp.Body).Decode(&cpuData); err != nil {
					fmt.Printf("%s Failed to parse CPU JSON: %v\n", logPrefix, err)
					updateServerStatus(db, server.ID, false, 0, 0, 0)
					online = false
				} else {
					cpuUsage = cpuData.Total
				}
			}
		}

		if online {
			// Get Memory usage
			memResp, err := client.Get(fmt.Sprintf("%s/api/4/mem", baseURL))
			if err != nil {
				fmt.Printf("%s Memory request failed: %v\n", logPrefix, err)
				updateServerStatus(db, server.ID, false, 0, 0, 0)
				online = false
			} else {
				defer memResp.Body.Close()

				if memResp.StatusCode != http.StatusOK {
					fmt.Printf("%s Bad memory status code: %d\n", logPrefix, memResp.StatusCode)
					updateServerStatus(db, server.ID, false, 0, 0, 0)
					online = false
				} else {
					var memData MemoryResponse
					if err := json.NewDecoder(memResp.Body).Decode(&memData); err != nil {
						fmt.Printf("%s Failed to parse memory JSON: %v\n", logPrefix, err)
						updateServerStatus(db, server.ID, false, 0, 0, 0)
						online = false
					} else {
						ramUsage = memData.Percent
					}
				}
			}
		}

		if online {
			// Get Disk usage
			fsResp, err := client.Get(fmt.Sprintf("%s/api/4/fs", baseURL))
			if err != nil {
				fmt.Printf("%s Filesystem request failed: %v\n", logPrefix, err)
				updateServerStatus(db, server.ID, false, 0, 0, 0)
				online = false
			} else {
				defer fsResp.Body.Close()

				if fsResp.StatusCode != http.StatusOK {
					fmt.Printf("%s Bad filesystem status code: %d\n", logPrefix, fsResp.StatusCode)
					updateServerStatus(db, server.ID, false, 0, 0, 0)
					online = false
				} else {
					var fsData FSResponse
					if err := json.NewDecoder(fsResp.Body).Decode(&fsData); err != nil {
						fmt.Printf("%s Failed to parse filesystem JSON: %v\n", logPrefix, err)
						updateServerStatus(db, server.ID, false, 0, 0, 0)
						online = false
					} else if len(fsData) > 0 {
						diskUsage = fsData[0].Percent
					}
				}
			}
		}

		// Check if status changed and send notification if needed
		if online != server.Online {
			status := "offline"
			if online {
				status = "online"
			}

			message := notificationTemplate
			message = strings.ReplaceAll(message, "!name", server.Name)
			message = strings.ReplaceAll(message, "!status", status)

			sendNotifications(message)
		}

		// Update server status with metrics
		updateServerStatus(db, server.ID, online, cpuUsage, ramUsage, diskUsage)

		// Add entry to server history
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_, err = db.ExecContext(ctx,
			`INSERT INTO server_history(
				"serverId", online, "cpuUsage", "ramUsage", "diskUsage", "createdAt"
			) VALUES ($1, $2, $3, $4, $5, now())`,
			server.ID, online, fmt.Sprintf("%.2f", cpuUsage), fmt.Sprintf("%.2f", ramUsage), fmt.Sprintf("%.2f", diskUsage),
		)
		cancel()
		if err != nil {
			fmt.Printf("%s Failed to insert history: %v\n", logPrefix, err)
		}

		fmt.Printf("%s Updated - CPU: %.2f%%, RAM: %.2f%%, Disk: %.2f%%\n",
			logPrefix, cpuUsage, ramUsage, diskUsage)
	}
}

func updateServerStatus(db *sql.DB, serverID int, online bool, cpuUsage, ramUsage, diskUsage float64) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx,
		`UPDATE server SET online = $1, "cpuUsage" = $2::float8, "ramUsage" = $3::float8, "diskUsage" = $4::float8
		 WHERE id = $5`,
		online, cpuUsage, ramUsage, diskUsage, serverID,
	)
	if err != nil {
		fmt.Printf("Failed to update server status (ID: %d): %v\n", serverID, err)
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
		case "pushover":
			if n.PushoverUrl.Valid && n.PushoverToken.Valid && n.PushoverUser.Valid {
				sendPushover(n, message)
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

func sendPushover(n Notification, message string) {
	form := url.Values{}
	form.Add("token", n.PushoverToken.String)
	form.Add("user", n.PushoverUser.String)
	form.Add("message", message)

	req, err := http.NewRequest("POST", n.PushoverUrl.String, strings.NewReader(form.Encode()))
	if err != nil {
		fmt.Printf("Pushover: ERROR creating request: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Pushover: ERROR sending request: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Pushover: ERROR status code: %d\n", resp.StatusCode)
	}
}

func checkAndSendTestNotifications(db *sql.DB) {
	// Query for test notifications
	rows, err := db.Query(`SELECT tn.id, tn."notificationId" FROM test_notification tn`)
	if err != nil {
		fmt.Printf("Error fetching test notifications: %v\n", err)
		return
	}
	defer rows.Close()

	// Process each test notification
	var testIds []int
	for rows.Next() {
		var id, notificationId int
		if err := rows.Scan(&id, &notificationId); err != nil {
			fmt.Printf("Error scanning test notification: %v\n", err)
			continue
		}

		// Add to list of IDs to delete
		testIds = append(testIds, id)

		// Find the notification configuration
		notifMutex.RLock()
		for _, n := range notifications {
			if n.ID == notificationId {
				// Send test notification
				fmt.Printf("Sending test notification to notification ID %d\n", notificationId)
				sendSpecificNotification(n, "Test notification from CoreControl")
			}
		}
		notifMutex.RUnlock()
	}

	// Delete processed test notifications
	if len(testIds) > 0 {
		for _, id := range testIds {
			_, err := db.Exec(`DELETE FROM test_notification WHERE id = $1`, id)
			if err != nil {
				fmt.Printf("Error deleting test notification (ID: %d): %v\n", id, err)
			}
		}
	}
}

func sendSpecificNotification(n Notification, message string) {
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
	case "pushover":
		if n.PushoverUrl.Valid && n.PushoverToken.Valid && n.PushoverUser.Valid {
			sendPushover(n, message)
		}
	}
}
