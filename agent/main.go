package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"time"

	_ "github.com/jackc/pgx/v4/stdlib"
	"github.com/joho/godotenv"
)

type Application struct {
	ID        int
	PublicURL string
	Online    bool
}

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

	go func() {
		deletionTicker := time.NewTicker(1 * time.Hour)
		defer deletionTicker.Stop()

		for range deletionTicker.C {
			if err := deleteOldEntries(db); err != nil {
				fmt.Printf("Error deleting old entries: %v\n", err)
			}
		}
	}()

	ticker := time.NewTicker(1 * time.Second)
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

func deleteOldEntries(db *sql.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	res, err := db.ExecContext(ctx,
		`DELETE FROM uptime_history WHERE "createdAt" < now() - interval '30 days'`)
	if err != nil {
		return err
	}
	affected, _ := res.RowsAffected()
	fmt.Printf("Deleted %d old entries from uptime_history\n", affected)
	return nil
}

func getApplications(db *sql.DB) []Application {
	rows, err := db.Query(`
        SELECT id, "publicURL", online 
        FROM application 
        WHERE "publicURL" IS NOT NULL
    `)
	if err != nil {
		fmt.Printf("Error fetching applications: %v\n", err)
		return nil
	}
	defer rows.Close()

	var apps []Application
	for rows.Next() {
		var app Application
		err := rows.Scan(&app.ID, &app.PublicURL, &app.Online)
		if err != nil {
			fmt.Printf("Error scanning row: %v\n", err)
			continue
		}
		apps = append(apps, app)
	}
	return apps
}

func checkAndUpdateStatus(db *sql.DB, client *http.Client, apps []Application) {
	fmt.Printf("Start checking %d applications at %v\n", len(apps), time.Now())

	for i, app := range apps {
		logPrefix := fmt.Sprintf("[App %d/%d URL: %s]", i+1, len(apps), app.PublicURL)
		fmt.Printf("%s Starting check\n", logPrefix)

		// HTTP Check
		startHTTP := time.Now()
		httpCtx, httpCancel := context.WithTimeout(context.Background(), 4*time.Second)
		defer httpCancel()

		req, err := http.NewRequestWithContext(httpCtx, "HEAD", app.PublicURL, nil)
		if err != nil {
			fmt.Printf("%s Request creation failed: %v\n", logPrefix, err)
			continue
		}

		resp, err := client.Do(req)
		httpDuration := time.Since(startHTTP)

		// Log HTTP details
		if err != nil {
			fmt.Printf("%s HTTP error after %v: %v\n", logPrefix, httpDuration, err)
		} else {
			fmt.Printf("%s HTTP %d after %v (ContentLength: %d)\n",
				logPrefix, resp.StatusCode, httpDuration, resp.ContentLength)
			resp.Body.Close() // Important to prevent leaks
		}

		isOnline := err == nil && resp != nil && resp.StatusCode >= 200 && resp.StatusCode < 300

		// Database Update
		dbCtx, dbCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer dbCancel()

		startUpdate := time.Now()
		updateRes, err := db.ExecContext(dbCtx,
			`UPDATE application SET online = $1 WHERE id = $2`,
			isOnline,
			app.ID,
		)
		updateDuration := time.Since(startUpdate)

		if err != nil {
			fmt.Printf("%s UPDATE failed after %v: %v\n", logPrefix, updateDuration, err)
		} else {
			affected, _ := updateRes.RowsAffected()
			fmt.Printf("%s UPDATE OK (%d rows) after %v\n", logPrefix, affected, updateDuration)
		}

		// History Insert
		startInsert := time.Now()
		insertRes, err := db.ExecContext(dbCtx,
			`INSERT INTO uptime_history ("applicationId", online, "createdAt") VALUES ($1, $2, now())`,
			app.ID,
			isOnline,
		)
		insertDuration := time.Since(startInsert)

		if err != nil {
			fmt.Printf("%s INSERT failed after %v: %v\n", logPrefix, insertDuration, err)
		} else {
			inserted, _ := insertRes.RowsAffected()
			fmt.Printf("%s INSERT OK (%d rows) after %v\n", logPrefix, inserted, insertDuration)
		}
	}
}
