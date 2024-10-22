// auth.go
package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

func verifyAccessToken(c *fiber.Ctx) (string, string, string, error) {
	cookie := c.Cookies("accessToken")
	if cookie == "" {
		logger.Warn("Access token cookie not found")
		return "", "", "", fiber.ErrUnauthorized
	}

	token, err := jwt.Parse(cookie, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if err != nil {
		logger.Warnf("Error parsing JWT token: %v", err)
		return "", "", "", fiber.ErrUnauthorized
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, _ := claims["user_id"].(string)
		username, _ := claims["username"].(string)
		deviceID, _ := claims["device_id"].(string)
		logger.Infof("Token decoded successfully: user_id=%s, username=%s, device_id=%s", userID, username, deviceID)
		return userID, username, deviceID, nil
	} else {
		logger.Warnf("Invalid JWT token")
		return "", "", "", fiber.ErrUnauthorized
	}
}
