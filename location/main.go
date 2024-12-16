// main.go

package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/sirupsen/logrus"
)

func main() {
	// Initialize Logging first
	initLogging()

	logrus.Info("Loading configuration...")
	config := LoadConfig()

	logrus.Info("Connecting to database...")
	pool := ConnectDB(config.GetDSN())
	defer pool.Close()

	logrus.Info("Initializing Fiber app...")
	app := fiber.New(fiber.Config{
		ErrorHandler: errorHandler,
	})

	// Use request logger middleware
	app.Use(requestLogger)

	// CORS middleware
	app.Use(cors.New())

	// Serve static files
	logrus.Info("Serving static files from ./static")
	app.Static("/", "./static")

	// Register handlers with logging
	logrus.Info("Registering routes...")
	app.Get("/autocomplete", AutocompleteHandler(pool))
	app.Get("/geocode", GeocodeHandler(pool))
	app.Get("/reverse", ReverseGeocodeHandler(pool))
	app.Get("/city/:country/:state?/:name?", ViewerHandler(pool))

	logrus.Infof("Server running on http://localhost:%s", config.ServerPort)
	if err := app.Listen(":" + config.ServerPort); err != nil {
		logrus.Fatalf("Failed to start server: %v", err)
	}
}
