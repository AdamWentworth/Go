// main.go

package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
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

func readEnvInt(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return fallback
	}
	return n
}

func newRateLimiter() fiber.Handler {
	maxReq := readEnvInt("RATE_LIMIT_MAX", 120)
	windowSec := readEnvInt("RATE_LIMIT_WINDOW_SEC", 60)

	return limiter.New(limiter.Config{
		Max:        maxReq,
		Expiration: time.Duration(windowSec) * time.Second,
		KeyGenerator: func(c *fiber.Ctx) string {
			if uid, ok := c.Locals("user_id").(string); ok && uid != "" {
				return "uid:" + uid
			}
			return "ip:" + c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "rate limit exceeded",
			})
		},
	})
}

func newApp() *fiber.App {
	bodyLimit := readEnvInt("MAX_BODY_BYTES", 1*1024*1024)

	app := fiber.New(fiber.Config{
		ErrorHandler:          errorHandler,
		DisableStartupMessage: true,
		BodyLimit:             bodyLimit,
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

	protected := app.Group("/", verifyJWT, newRateLimiter())
	protected.Get("/api/searchPokemon", SearchPokemonInstances)
	protected.Get("/api/searchPokemon/", SearchPokemonInstances)

	return app
}

func main() {
	// Initialize configuration, environment, and logging
	initLogging()
	initEnv()
	initJWTSecret()
	initAllowedOrigins()
	initDB()

	app := newApp()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3006"
	}

	// Use fmt.Println for startup messages without time and log level
	fmt.Printf("Starting Search Service at http://127.0.0.1:%s/\n", port)
	fmt.Println("Quit the server with CTRL-C")

	// Start server
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Server failed to start", err)
	}
}
