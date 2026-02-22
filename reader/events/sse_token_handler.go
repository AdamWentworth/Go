package main

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

const maxDeviceIDLength = 255

func issueSSEToken(c *fiber.Ctx) error {
	if len(jwtSecret) == 0 {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Server configuration error"})
	}

	userID, _ := c.Locals("user_id").(string)
	username, _ := c.Locals("username").(string)
	if strings.TrimSpace(userID) == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	deviceID := strings.TrimSpace(c.Query("device_id"))
	if deviceID == "" {
		if tokenDeviceID, ok := c.Locals("device_id").(string); ok {
			deviceID = strings.TrimSpace(tokenDeviceID)
		}
	}
	if deviceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing device_id"})
	}
	if len(deviceID) > maxDeviceIDLength {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid device_id"})
	}

	now := time.Now()
	claims := AccessTokenClaims{
		UserID:   userID,
		Username: username,
		DeviceID: deviceID,
		TokenUse: "sse",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(sseTokenTTL)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now.Add(-5 * time.Second)),
		},
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(jwtSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to issue stream token"})
	}

	return c.JSON(fiber.Map{
		"token":              signed,
		"expires_in_seconds": int(sseTokenTTL.Seconds()),
	})
}
