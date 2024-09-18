// main.go
package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Set Gin to release mode to suppress debug logs
	gin.SetMode(gin.ReleaseMode)

	// Initialize the logger
	initLogger()

	// Define the port (3003)
	port := "3003"

	// Load environment variables
	err := loadEnv()
	if err != nil {
		logger.Fatal("Error loading environment variables:", err)
	}

	// Load application configuration (Kafka)
	err = loadConfigFile("config/app_conf.yml")
	if err != nil {
		logger.Fatal("Error loading application configuration:", err)
	}

	// Initialize Kafka producer (using kafka-go)
	initializeKafkaProducer()

	// Initialize GIN router
	router := gin.New()

	// **Add the Gin logger middleware**
	router.Use(gin.Logger())

	// Use recovery middleware to handle panics and log errors
	router.Use(gin.Recovery())

	// Set up CORS middleware to allow requests from localhost:3000
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
	}))

	// Add a log entry for server start using the centralized logger
	logger.Infof("Server started on port %s", port)

	// Define the route for handling batched updates
	router.POST("/api/batchedUpdates", handleBatchedUpdates)

	// Start the server
	if err := router.Run(":" + port); err != nil {
		logger.Fatal("Error starting server:", err)
	}
}
