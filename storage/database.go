// database.go

package main

import (
    "fmt"
    "os"
    "time"

    "github.com/sirupsen/logrus"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() error {
    user := os.Getenv("DB_USER")
    pass := os.Getenv("DB_PASSWORD")
    host := os.Getenv("DB_HOSTNAME")
    port := os.Getenv("DB_PORT")
    dbName := os.Getenv("DB_NAME")

    // Data Source Name (DSN) for connecting to the database
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        user, pass, host, port, dbName)

    // Define the logrus logger
    logrusLogger := logrus.New()
    logrusLogger.SetFormatter(&CustomFormatter{}) // Assuming CustomFormatter is defined in logging.go
    logrusLogger.SetOutput(os.Stdout)
    logrusLogger.SetLevel(logrus.InfoLevel) // Set the desired log level for your application

    // Create a new GORM logger instance using logrus
    gormLogger := logger.New(
        logrusLogger, // io.Writer
        logger.Config{
            SlowThreshold:             200 * time.Millisecond, // Threshold for slow queries
            LogLevel:                  logger.Warn,            // Log level set to Warn to exclude SQL statements
            IgnoreRecordNotFoundError: true,                   // Ignore ErrRecordNotFound errors
            Colorful:                  false,                  // Disable color in logs (optional)
        },
    )

    // Initialize the GORM DB connection with the custom logger
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
        Logger: gormLogger,
    })
    if err != nil {
        logrus.Fatalf("Failed to connect to DB: %v", err)
    }
    DB = db

    // Optional: Verify the database connection
    sqlDB, err := DB.DB()
    if err != nil {
        logrus.Fatalf("Failed to get DB from GORM: %v", err)
    }
    if err := sqlDB.Ping(); err != nil {
        logrus.Fatalf("Failed to ping DB: %v", err)
    }

    logrus.Info("Database connected successfully.")
    return nil
}
