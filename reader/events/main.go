package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var db *gorm.DB
var jwtSecret []byte

func dbReady() bool {
	if db == nil {
		return false
	}
	sqlDB, err := db.DB()
	if err != nil {
		return false
	}
	return sqlDB.Ping() == nil
}

func main() {
	// Initialize configuration, environment, and logging
	initLogging()
	initEnv()
	loadConfig()
	initJWTSecret()
	initAllowedOrigins()
	initDB()

	app := fiber.New(fiber.Config{
		ErrorHandler:          errorHandler,
		DisableStartupMessage: true,
	})

	registerMetrics()
	app.Use(requestLogger)
	app.Use(corsMiddleware)
	app.Use(metricsMiddleware)

	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
	})
	app.Get("/readyz", func(c *fiber.Ctx) error {
		if !dbReady() {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"ok": false, "message": "db not ready"})
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
	})
	app.Get("/metrics", metricsHandler())

	protected := app.Group("/", verifyJWT)
	protected.Get("/api/sse", sseHandler)
	protected.Get("/api/getUpdates", GetUpdates)
	protected.Get("/api/sse-token", issueSSEToken)

	startKafkaConsumer()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3008"
	}

	fmt.Printf("Starting Events Service at http://127.0.0.1:%s/\n", port)
	fmt.Println("Quit the server with CTRL-C")

	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Events Service failed to start", err)
	}
}
