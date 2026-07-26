// main.go
package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/limiter"
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
		KeyGenerator: func(c fiber.Ctx) string {
			if uid, ok := c.Locals("user_id").(string); ok && uid != "" {
				return "uid:" + uid
			}
			return "ip:" + c.IP()
		},
		LimitReached: func(c fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "rate limit exceeded",
			})
		},
	})
}

func newApp() *fiber.App {
	bodyLimit := readEnvInt("MAX_BODY_BYTES", 1*1024*1024)

	app := fiber.New(fiber.Config{
		ErrorHandler: errorHandler,
		BodyLimit:    bodyLimit,
	})

	registerMetrics()

	// Use request logging middleware
	app.Use(requestLogger)

	// Use CORS middleware
	app.Use(corsMiddleware)
	app.Use(metricsMiddleware)

	app.Get("/healthz", func(c fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
	})
	app.Get("/readyz", func(c fiber.Ctx) error {
		if !dbReady() {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"ok": false, "message": "db not ready"})
		}
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
	})
	app.Get("/metrics", metricsHandler())

	// Unprotected routes
	// Canonical route.
	app.Get("/api/public/users/:username", optionalJWT, GetPublicSnapshotByUsername)
	// Compatibility route for /api/users/ prefix + nginx rewrite behavior.
	app.Get("/api/users/public/users/:username", optionalJWT, GetPublicSnapshotByUsername)
	publicRead := app.Group("/", newRateLimiter())
	publicRead.Get("/api/profiles/:username", optionalJWT, GetProfileHandler)
	publicRead.Get("/api/users/profiles/:username", optionalJWT, GetProfileHandler)
	publicRead.Get("/api/autocomplete-trainers", optionalJWT, AutocompleteTrainersHandler)

	// Public read-only profile instance lookups (used by search/foreign profile pages).
	// Keep these outside JWT middleware so users can browse profiles while logged out.
	publicRead.Get("/api/instances/by-username/:username", optionalJWT, GetInstancesByUsername)
	// Compatibility paths for /api/users prefix + nginx rewrite behavior.
	publicRead.Get("/api/users/instances/by-username/:username", optionalJWT, GetInstancesByUsername)

	// Protected routes (explicit auth binding so public routes never require JWT).
	protectedLimiter := newRateLimiter()
	// Canonical paths.
	app.Get("/api/users/:user_id/overview", verifyJWT, protectedLimiter, GetUserOverviewHandler)
	app.Put("/api/users/:user_id", verifyJWT, protectedLimiter, UpdateUserHandler)
	app.Put("/api/update-user/:user_id", verifyJWT, protectedLimiter, UpdateUserHandler)
	app.Put("/api/users/update-user/:user_id", verifyJWT, protectedLimiter, UpdateUserHandler)
	app.Put("/api/profile", verifyJWT, protectedLimiter, UpdateProfileHandler)
	app.Get("/api/preferences", verifyJWT, protectedLimiter, GetPreferencesHandler)
	app.Put("/api/preferences", verifyJWT, protectedLimiter, UpdatePreferencesHandler)
	app.Get("/api/friends", verifyJWT, protectedLimiter, GetFriendsHandler)
	app.Post("/api/friends/requests", verifyJWT, protectedLimiter, CreateFriendRequestHandler)
	app.Post("/api/friends/requests/:friendship_id/accept", verifyJWT, protectedLimiter, AcceptFriendRequestHandler)
	app.Delete("/api/friends/requests/:friendship_id", verifyJWT, protectedLimiter, DeleteFriendRequestHandler)
	app.Delete("/api/friends/:user_id", verifyJWT, protectedLimiter, RemoveFriendHandler)
	app.Post("/api/friends/blocks", verifyJWT, protectedLimiter, BlockUserHandler)
	app.Delete("/api/friends/blocks/:user_id", verifyJWT, protectedLimiter, UnblockUserHandler)
	// Compatibility paths for older clients. Keep generic parameters after every
	// named route so values such as "profile" cannot shadow a real endpoint.
	app.Get("/api/:user_id/overview", verifyJWT, protectedLimiter, GetUserOverviewHandler)
	app.Put("/api/:user_id", verifyJWT, protectedLimiter, UpdateUserHandler)

	return app
}

func main() {
	// Initialize configuration, environment, and logging
	initLogging()   // Initialize logging early
	initEnv()       // Load environment variables
	initJWTSecret() // Load the JWT_SECRET environment variable
	initAllowedOrigins()
	initDB() // Connect to the database

	app := newApp()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3005"
	}

	fmt.Printf("Starting User Service at http://127.0.0.1:%s/\n", port)
	fmt.Println("Quit the server with CTRL-C")

	// Start server
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("User Service failed to start", err)
	}
}
