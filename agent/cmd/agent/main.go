package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/corecontrol/agent/internal/app"
	"github.com/corecontrol/agent/internal/database"
	"github.com/corecontrol/agent/internal/notifications"
	"github.com/corecontrol/agent/internal/server"
)

func main() {
	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		panic(fmt.Sprintf("Database initialization failed: %v\n", err))
	}
	defer db.Close()

	// Initialize notification sender
	notifSender := notifications.NewNotificationSender()

	// Initial load of notifications
	notifs, err := database.LoadNotifications(db)
	if err != nil {
		panic(fmt.Sprintf("Failed to load notifications: %v", err))
	}
	notifSender.UpdateNotifications(notifs)

	// Reload notification configs every minute
	go func() {
		reloadTicker := time.NewTicker(time.Minute)
		defer reloadTicker.Stop()

		for range reloadTicker.C {
			newNotifs, err := database.LoadNotifications(db)
			if err != nil {
				fmt.Printf("Failed to reload notifications: %v\n", err)
				continue
			}
			notifSender.UpdateNotifications(newNotifs)
			fmt.Println("Reloaded notification configurations")
		}
	}()

	// Clean up old entries hourly
	go func() {
		deletionTicker := time.NewTicker(time.Hour)
		defer deletionTicker.Stop()

		for range deletionTicker.C {
			if err := database.DeleteOldEntries(db); err != nil {
				fmt.Printf("Error deleting old entries: %v\n", err)
			}
		}
	}()

	// Check for test notifications every 10 seconds
	go func() {
		testNotifTicker := time.NewTicker(10 * time.Second)
		defer testNotifTicker.Stop()

		for range testNotifTicker.C {
			notifs := notifSender.GetNotifications()
			database.CheckAndSendTestNotifications(db, notifs, notifSender.SendSpecificNotification)
		}
	}()

	// HTTP clients
	appClient := &http.Client{
		Timeout: 4 * time.Second,
	}

	serverClient := &http.Client{
		Timeout: 5 * time.Second,
	}

	// Server monitoring every 5 seconds
	go func() {
		serverTicker := time.NewTicker(5 * time.Second)
		defer serverTicker.Stop()

		for range serverTicker.C {
			servers, err := database.GetServers(db)
			if err != nil {
				fmt.Printf("Error getting servers: %v\n", err)
				continue
			}
			server.MonitorServers(db, serverClient, servers, notifSender)
		}
	}()

	// Application monitoring every 10 seconds
	appTicker := time.NewTicker(time.Second)
	defer appTicker.Stop()

	for now := range appTicker.C {
		if now.Second()%10 != 0 {
			continue
		}

		apps, err := database.GetApplications(db)
		if err != nil {
			fmt.Printf("Error getting applications: %v\n", err)
			continue
		}
		app.MonitorApplications(db, appClient, apps, notifSender)
	}
}
