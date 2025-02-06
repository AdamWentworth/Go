// main.go
package main

import (
	"crypto/tls"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// ------------------------------------------------------------
// Types and Config for Security Middleware
// ------------------------------------------------------------

// SecurityConfig holds the configuration for the security middleware
type SecurityConfig struct {
	// Maximum request header size in bytes
	MaxHeaderSize int
	// Maximum number of requests per minute per IP
	RateLimit int
	// List of allowed TLS cipher suites
	AllowedCipherSuites []uint16
	// List of allowed TLS versions
	AllowedTLSVersions []uint16
	// List of blocked IPs
	BlockedIPs map[string]bool
	// Rate limiting tracking
	rateLimiter *RateLimiter
}

// RateLimiter handles rate limiting per IP
type RateLimiter struct {
	requests map[string]*IPRequests
	mu       sync.RWMutex
}

type IPRequests struct {
	count    int
	lastTime time.Time
}

// NewSecurityConfig creates a new security configuration
func NewSecurityConfig() *SecurityConfig {
	return &SecurityConfig{
		MaxHeaderSize: 8192, // 8KB max header size
		RateLimit:     60,   // 60 requests per minute
		AllowedCipherSuites: []uint16{
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		},
		AllowedTLSVersions: []uint16{
			tls.VersionTLS12,
			tls.VersionTLS13,
		},
		BlockedIPs: make(map[string]bool),
		rateLimiter: &RateLimiter{
			requests: make(map[string]*IPRequests),
		},
	}
}

// SecurityMiddleware creates a new security middleware for Fiber
func SecurityMiddleware(config *SecurityConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		ip := c.IP()

		// Check if IP is blocked
		if config.BlockedIPs[ip] {
			logger.Warnf("Blocked request from IP: %s", ip)
			return c.SendStatus(fiber.StatusForbidden)
		}

		// Rate limiting
		if !checkRateLimit(config.rateLimiter, ip, config.RateLimit) {
			logger.Warnf("Rate limit exceeded for IP: %s", ip)
			return c.SendStatus(fiber.StatusTooManyRequests)
		}

		// Check request headers size
		if c.Request().Header.Len() > config.MaxHeaderSize {
			logger.Warnf("Request header too large from IP: %s", ip)
			return c.SendStatus(fiber.StatusRequestHeaderFieldsTooLarge)
		}

		// TLS verification if using HTTPS
		if c.Protocol() == "https" {
			if tlsConn, ok := c.Context().Conn().(*tls.Conn); ok {
				state := tlsConn.ConnectionState()

				// Check TLS version
				validVersion := false
				for _, version := range config.AllowedTLSVersions {
					if state.Version == version {
						validVersion = true
						break
					}
				}
				if !validVersion {
					logger.Warnf("Invalid TLS version from IP: %s", ip)
					return c.SendStatus(fiber.StatusForbidden)
				}

				// Check cipher suite
				validCipher := false
				for _, cipher := range config.AllowedCipherSuites {
					if state.CipherSuite == cipher {
						validCipher = true
						break
					}
				}
				if !validCipher {
					logger.Warnf("Invalid cipher suite from IP: %s", ip)
					return c.SendStatus(fiber.StatusForbidden)
				}
			}
		}

		// Check for suspicious patterns (headers, etc.)
		if detectSuspiciousPatterns(c) {
			logger.Warnf("Suspicious request pattern detected from IP: %s", ip)
			// Decide whether to block, rate-limit more aggressively, or just log
		}

		return c.Next()
	}
}

// checkRateLimit verifies if an IP has exceeded the allowed requests per minute
func checkRateLimit(limiter *RateLimiter, ip string, limit int) bool {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	now := time.Now()
	if req, exists := limiter.requests[ip]; exists {
		if now.Sub(req.lastTime) < time.Minute {
			if req.count >= limit {
				return false
			}
			req.count++
		} else {
			req.count = 1
			req.lastTime = now
		}
	} else {
		limiter.requests[ip] = &IPRequests{
			count:    1,
			lastTime: now,
		}
	}
	return true
}

// detectSuspiciousPatterns attempts to identify common malicious input patterns
func detectSuspiciousPatterns(c *fiber.Ctx) bool {
	suspicious := false
	headers := make(map[string]string)

	c.Request().Header.VisitAll(func(key, val []byte) {
		headers[string(key)] = string(val)
	})

	// Check each header for suspicious patterns
	for _, value := range headers {
		// Check for overflow attempts
		if len(value) > 1024 {
			suspicious = true
			break
		}

		lowerValue := strings.ToLower(value)

		// Check for SQL injection attempts
		if strings.Contains(lowerValue, "union select") ||
			strings.Contains(lowerValue, "' or '1'='1") {
			suspicious = true
			break
		}

		// Check for common XSS patterns
		if strings.Contains(lowerValue, "<script") ||
			strings.Contains(lowerValue, "javascript:") {
			suspicious = true
			break
		}
	}

	return suspicious
}

// ------------------------------------------------------------
// Main Application Entry Point
// ------------------------------------------------------------

func main() {
	// 1. Initialize the logger
	initLogger()

	// 2. Load environment variables
	if err := loadEnv(); err != nil {
		logger.Fatal("Error loading environment variables:", err)
	}

	// 3. Load application configuration (Kafka, etc.)
	if err := loadConfigFile("config/app_conf.yml"); err != nil {
		logger.Fatal("Error loading application configuration:", err)
	}

	// 4. Initialize Kafka producer
	initializeKafkaProducer()

	// 5. Create new Fiber app with custom error handler and body limit
	app := fiber.New(fiber.Config{
		ErrorHandler: errorHandler,     // your custom error handler
		BodyLimit:    50 * 1024 * 1024, // 50 MB
	})

	// 6. Register custom logger and recovery middleware
	app.Use(requestLogger)
	app.Use(recoverMiddleware)

	// 7. Set up Security Middleware
	securityConfig := NewSecurityConfig()
	// Example: block a specific IP if needed
	// securityConfig.BlockedIPs["192.168.1.100"] = true
	app.Use(SecurityMiddleware(securityConfig))

	// 8. Set up CORS (allow requests from http://localhost:3000)
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Content-Type,Authorization,X-Requested-With",
		AllowCredentials: true,
	}))

	// 9. Log server start
	port := "3003"
	logger.Infof("Server started on port %s", port)

	// 10. Define application routes
	app.Post("/api/batchedUpdates", handleBatchedUpdates)

	// 11. Start the Fiber server
	if err := app.Listen(":" + port); err != nil {
		logger.Fatal("Error starting server:", err)
	}
}
