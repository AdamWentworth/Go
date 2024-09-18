// main.go

package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var db *gorm.DB
var jwtSecret []byte // Moved here to be accessible across files

func main() {
	// Initialize configuration, environment, and logging
	initLogging()   // Initialize logging early
	initEnv()       // Load environment variables
	initJWTSecret() // Load the JWT_SECRET environment variable
	initDB()        // Connect to the database

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: errorHandler, // Custom error handler
	})

	// Use request logging middleware
	app.Use(requestLogger)

	// Use CORS middleware
	app.Use(corsMiddleware)

	// Protected routes
	protected := app.Group("/", verifyJWT) // JWT middleware to protect routes
	protected.Get("/api/ownershipData/:user_id", GetPokemonInstances)
	protected.Get("/api/discoverPokemon/", SearchPokemonInstances)

	// Use fmt.Println for startup messages without time and log level
	fmt.Println("Starting development server at http://127.0.0.1:3005/")
	fmt.Println("Quit the server with CTRL-BREAK")

	// Start server
	if err := app.Listen(":3005"); err != nil {
		log.Fatal("Server failed to start", err)
	}
}
