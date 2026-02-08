// auth.go
package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

type AccessTokenClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	DeviceID string `json:"device_id"`
	jwt.RegisteredClaims
}

func verifyAccessToken(c *fiber.Ctx) (string, string, string, error) {
	cookie := c.Cookies("accessToken")
	if cookie == "" {
		logger.Warn("Access token cookie not found")
		return "", "", "", fiber.ErrUnauthorized
	}

	claims := &AccessTokenClaims{}
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

	token, err := parser.ParseWithClaims(cookie, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})
	if err != nil {
		logger.Warnf("Error parsing JWT token: %v", err)
		return "", "", "", fiber.ErrUnauthorized
	}

	if !token.Valid {
		logger.Warn("Invalid JWT token")
		return "", "", "", fiber.ErrUnauthorized
	}

	if claims.ExpiresAt == nil {
		logger.Warn("JWT is missing exp claim")
		return "", "", "", fiber.ErrUnauthorized
	}

	if claims.UserID == "" || claims.Username == "" {
		logger.Warn("JWT missing required user claims")
		return "", "", "", fiber.ErrUnauthorized
	}

	if claims.DeviceID == "" {
		logger.Warn("JWT missing required device_id claim")
		return "", "", "", fiber.ErrUnauthorized
	}

	return claims.UserID, claims.Username, claims.DeviceID, nil
}
