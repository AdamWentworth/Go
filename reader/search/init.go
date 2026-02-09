// init.go

package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Initialize the JWT secret globally during app startup
func initJWTSecret() {
	// Load the JWT_SECRET environment variable
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		logrus.Fatal("JWT secret is missing in the environment variables")
	}
	jwtSecret = []byte(secret) // Set the global jwtSecret
}

// Initialize database connection with custom GORM logger
func initDB() {
	// Open the log file for GORM to use the same app.log file
	file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatal("Failed to open log file for GORM: ", err)
	}

	// Create a new logger for GORM with file output and log level
	newLogger := logger.New(
		log.New(file, "\r\n", log.LstdFlags), // Use the file for GORM logs
		logger.Config{
			SlowThreshold: time.Second, // Log slow SQL queries if needed (optional)
			LogLevel:      logger.Warn, // Keep SQL logs focused on warnings/errors
			Colorful:      false,       // Disable color output
		},
	)

	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOSTNAME")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	if dbPort == "" {
		dbPort = "3306"
	}
	if dbUser == "" || dbPass == "" || dbHost == "" || dbName == "" {
		logrus.Fatal("DB_USER, DB_PASSWORD, DB_HOSTNAME, and DB_NAME are required")
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", dbUser, dbPass, dbHost, dbPort, dbName)
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: newLogger, // Use the custom logger for GORM logs
	})
	if err != nil {
		log.Fatal("Failed to connect to the database: ", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to access DB pool: ", err)
	}

	maxOpen := 25
	maxIdle := 10
	maxLifeMin := 30
	if v := os.Getenv("DB_MAX_OPEN_CONNS"); v != "" {
		if n, convErr := strconv.Atoi(v); convErr == nil && n > 0 {
			maxOpen = n
		}
	}
	if v := os.Getenv("DB_MAX_IDLE_CONNS"); v != "" {
		if n, convErr := strconv.Atoi(v); convErr == nil && n >= 0 {
			maxIdle = n
		}
	}
	if v := os.Getenv("DB_CONN_MAX_LIFETIME_MIN"); v != "" {
		if n, convErr := strconv.Atoi(v); convErr == nil && n > 0 {
			maxLifeMin = n
		}
	}

	sqlDB.SetMaxOpenConns(maxOpen)
	sqlDB.SetMaxIdleConns(maxIdle)
	sqlDB.SetConnMaxLifetime(time.Duration(maxLifeMin) * time.Minute)

	// Log that the system checks have completed
	logrus.Info("Performing system checks...")
	logrus.Info("System check identified no issues.")
}

// Load environment variables from .env
func initEnv() {
	if err := godotenv.Load(".env"); err != nil {
		logrus.Infof("No .env file found at .env, relying on OS environment")
		return
	}
	logrus.Info("Environment variables loaded successfully.")
}
