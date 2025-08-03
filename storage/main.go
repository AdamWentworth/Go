// main.go

package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/robfig/cron/v3"
	"github.com/sirupsen/logrus"
)

func main() {
	// 1) Init the logger
	if err := InitLogger(); err != nil {
		panic(err)
	}

	// 2) Load environment + app configs
	if err := LoadAppConfig(".env"); err != nil {
		logrus.Fatalf("Failed to load config: %v", err)
	}

	// 3) Initialize DB
	if err := InitDB(); err != nil {
		logrus.Fatalf("Failed to initialize db: %v", err)
	}

	// 4) Start Kafka Consumer
	ctx, cancel := context.WithCancel(context.Background())
	go StartConsumer(ctx)

	// 5) Scheduler
	c := cron.New(cron.WithLogger(cron.PrintfLogger(logrus.StandardLogger())))
	// Daily DB backup is handled by host cron by default.
	// If you ever need the app to run backups (dev box, emergency), set RUN_APP_BACKUPS=true.
	if os.Getenv("RUN_APP_BACKUPS") == "true" {
	    _, err := c.AddFunc("0 0 * * *", CreateBackup)
	    if err != nil {
	        logrus.Fatalf("Failed to schedule CreateBackup: %v", err)
	    }
	    logrus.Info("App-owned backups are ENABLED via RUN_APP_BACKUPS=true.")
	} else {
	    logrus.Info("App-owned backups are DISABLED (RUN_APP_BACKUPS!=true). Host cron is the source of truth.")
	}
	// Schedule ReprocessFailedMessages every 5 minutes
	_, err = c.AddFunc("@every 5m", ReprocessFailedMessages)
	if err != nil {
		logrus.Fatalf("Failed to schedule ReprocessFailedMessages: %v", err)
	}
	c.Start()

	logrus.Info("Backup scheduler started. Scheduled jobs are running.")

	// 6) Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	logrus.Info("Shutdown signal received...")
	cancel()
	c.Stop()
	logrus.Info("All background services stopped. Exiting now.")
}
