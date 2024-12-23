// main.go
package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
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

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: errorHandler,     // keep your custom error handler
		BodyLimit:    50 * 1024 * 1024, // 50 MB
	})

	// Use custom logger middleware
	app.Use(requestLogger)

	// Use recovery middleware to handle panics and log errors
	app.Use(recoverMiddleware)

	// Set up CORS middleware to allow requests from localhost:3000
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Content-Type,Authorization,X-Requested-With",
		AllowCredentials: true,
	}))

	// Add a log entry for server start using the centralized logger
	logger.Infof("Server started on port %s", port)

	// Define the route for handling batched updates
	app.Post("/api/batchedUpdates", handleBatchedUpdates)

	// Start the server
	if err := app.Listen(":" + port); err != nil {
		logger.Fatal("Error starting server:", err)
	}
}
