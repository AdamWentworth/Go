// main.go

package main

import (
	"context"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

func dbReady(pool *pgxpool.Pool) bool {
	if pool == nil {
		return false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	return pool.Ping(ctx) == nil
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
	maxReq := readEnvInt("RATE_LIMIT_MAX", 180)
	windowSec := readEnvInt("RATE_LIMIT_WINDOW_SEC", 60)

	return limiter.New(limiter.Config{
		Max:        maxReq,
		Expiration: time.Duration(windowSec) * time.Second,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "rate limit exceeded",
			})
		},
	})
}

func newApp(pool *pgxpool.Pool) *fiber.App {
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
		if !dbReady(pool) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"ok": false, "message": "db not ready"})
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
	})
	app.Get("/metrics", adaptor.HTTPHandler(promhttp.Handler()))

	protected := app.Group("/", newRateLimiter())
	protected.Get("/autocomplete", AutocompleteHandler(pool))
	protected.Get("/geocode", GeocodeHandler(pool))
	protected.Get("/reverse", ReverseGeocodeHandler(pool))
	protected.Get("/city/:country/:state?/:name?", ViewerHandler(pool))
	protected.Get("/city/:country", ViewerHandler(pool))

	// Serve static files last, so API routes take precedence.
	logrus.Info("Serving static files from ./static")
	app.Static("/", "./static")

	return app
}

func main() {
	initEnv()
	initLogging()
	initAllowedOrigins()

	logrus.Info("Loading configuration...")
	config := LoadConfig()

	logrus.Info("Connecting to database...")
	pool := ConnectDB(config.GetDSN())
	defer pool.Close()

	logrus.Info("Initializing Fiber app...")
	app := newApp(pool)

	logrus.Infof("Server running on http://localhost:%s", config.ServerPort)
	if err := app.Listen(":" + config.ServerPort); err != nil {
		logrus.Fatalf("Failed to start server: %v", err)
	}
}
