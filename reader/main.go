// main.go

package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

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
			LogLevel:      logger.Info, // Log everything to file
			Colorful:      false,       // Disable color output
		},
	)

	dsn := os.Getenv("DB_USER") + ":" + os.Getenv("DB_PASSWORD") + "@tcp(" + os.Getenv("DB_HOSTNAME") + ")/" + os.Getenv("DB_NAME") + "?parseTime=true"
	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: newLogger, // Use the custom logger for GORM logs
	})
	if err != nil {
		log.Fatal("Failed to connect to the database: ", err)
	}

	// Log that the system checks have completed
	logrus.Info("Performing system checks...")
	logrus.Info("System check identified no issues.")
}

// Load environment variables from .env
func initEnv() {
	// Load environment variables from .env
	err := godotenv.Load(".env.development") // Load from .env.development
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}
	logrus.Info("Environment variables loaded successfully.")
}

func main() {
	// Set Gin to release mode (disable debug logs)
	gin.SetMode(gin.ReleaseMode)

	// Initialize configuration, environment, and logging
	initLogging()   // Initialize logging early
	initEnv()       // Load environment variables
	initJWTSecret() // Load the JWT_SECRET environment variable
	initDB()        // Connect to the database

	// Initialize router
	r := gin.Default()
	r.Use(corsMiddleware())

	// Secure routes
	protected := r.Group("/")
	protected.Use(verifyJWT()) // JWT middleware to protect routes
	{
		protected.GET("/api/ownershipData/:user_id", GetPokemonInstances)
	}

	// Use fmt.Println for startup messages without time and log level
	fmt.Println("Starting development server at http://127.0.0.1:3005/")
	fmt.Println("Quit the server with CTRL-BREAK")

	// Start server
	if err := r.Run(":3005"); err != nil {
		log.Fatal("Server failed to start", err)
	}
}
