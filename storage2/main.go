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
    if err := LoadAppConfig(".env.development"); err != nil {
        logrus.Fatalf("failed to load config: %v", err)
    }

    // 3) Initialize DB
    if err := InitDB(); err != nil {
        logrus.Fatalf("failed to initialize db: %v", err)
    }

    // 4) Start Kafka Consumer
    ctx, cancel := context.WithCancel(context.Background())
    go StartConsumer(ctx)

    // 5) Scheduler
    c := cron.New()
    c.AddFunc("0 0 * * *", CreateBackup)
    c.AddFunc("*/5 * * * *", ReprocessFailedMessages)
    c.Start()

    logrus.Info("Storage service started. Kafka consumer + scheduled jobs running.")

    // 6) Graceful shutdown
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
    <-sigChan

    logrus.Info("Shutdown signal received...")
    cancel()
    c.Stop()
    logrus.Info("All background services stopped. Exiting now.")
}
