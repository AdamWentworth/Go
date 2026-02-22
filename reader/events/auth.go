// auth.go

package main

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/sirupsen/logrus"
)

type AccessTokenClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	DeviceID string `json:"device_id"`
	TokenUse string `json:"token_use,omitempty"`
	jwt.RegisteredClaims
}

const maxAccessTokenLength = 8192
const sseTokenTTL = 5 * time.Minute

func readAccessToken(c *fiber.Ctx) (string, string) {
	if token := strings.TrimSpace(c.Cookies("accessToken")); token != "" {
		return token, "cookie"
	}

	authHeader := strings.TrimSpace(c.Get("Authorization"))
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			token := strings.TrimSpace(parts[1])
			if token != "" {
				return token, "authorization"
			}
		}
	}

	if token := strings.TrimSpace(c.Query("access_token")); token != "" {
		return token, "query"
	}
	if token := strings.TrimSpace(c.Query("stream_token")); token != "" {
		return token, "stream_query"
	}

	return "", ""
}

// Middleware to verify the access token from cookie/header/query.
func verifyJWT(c *fiber.Ctx) error {
	if len(jwtSecret) == 0 {
		logrus.Error("JWT secret is not initialized")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Server configuration error"})
	}

	tokenString, tokenSource := readAccessToken(c)
	if tokenString == "" {
		logrus.Warn("Authentication failed: access token missing")
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
	}
	if len(tokenString) > maxAccessTokenLength {
		logrus.Warnf("Authentication failed: access token too large (%s)", tokenSource)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
	}

	claims := &AccessTokenClaims{}
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	token, err := parser.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		logrus.Warnf("Authentication failed: invalid JWT (%v)", err)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
	}

	if claims.ExpiresAt == nil {
		logrus.Warn("Authentication failed: JWT missing exp")
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
	}
	if claims.UserID == "" {
		logrus.Warn("Authentication failed: JWT missing user_id")
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
	}

	if tokenSource == "stream_query" {
		if claims.TokenUse != "sse" {
			logrus.Warn("Authentication failed: stream token missing sse token_use")
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
		}
		queryDeviceID := strings.TrimSpace(c.Query("device_id"))
		if claims.DeviceID != "" && queryDeviceID != "" && claims.DeviceID != queryDeviceID {
			logrus.Warn("Authentication failed: stream token device mismatch")
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
		}
	}

	c.Locals("user_id", claims.UserID)
	c.Locals("username", claims.Username)
	if claims.DeviceID != "" {
		c.Locals("device_id", claims.DeviceID)
	}

	return c.Next()
}
