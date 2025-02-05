// auth.go

package main

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/sirupsen/logrus"
)

// Middleware to verify the JWT
func verifyJWT(c *fiber.Ctx) error {
	// Ensure jwtSecret has been initialized
	if len(jwtSecret) == 0 {
		logrus.Fatal("JWT secret is not initialized") // Fails if not set
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Server configuration error"})
	}

	tokenString := c.Cookies("accessToken") // Get token from cookie
	if tokenString == "" {
		logrus.Error("Authentication failed: JWT token is missing in cookies")
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		logrus.Error("Authentication failed: JWT token parsing failed")
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		logrus.Info("Token decoded successfully")

		// Extract user_id from token
		if userID, ok := claims["user_id"].(string); ok {
			c.Locals("user_id", userID)
		} else {
			logrus.Error("Authentication failed: user_id claim missing")
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
		}

		// Extract username from token
		if username, ok := claims["username"].(string); ok {
			c.Locals("username", username)
		} else {
			// Optionally handle the missing username case without failing the request.
			logrus.Warn("username claim missing in token; proceeding without username")
			c.Locals("username", "")
		}

		// Optionally, if you need device_id and it exists in the token:
		if deviceID, ok := claims["device_id"].(string); ok {
			c.Locals("device_id", deviceID)
		}
	}

	return c.Next()
}
