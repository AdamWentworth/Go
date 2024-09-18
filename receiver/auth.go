// auth.go
package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

func verifyAccessToken(c *fiber.Ctx) (string, string, error) {
	cookie := c.Cookies("accessToken")
	if cookie == "" {
		logger.Warn("Access token cookie not found")
		return "", "", fiber.ErrUnauthorized
	}

	token, err := jwt.Parse(cookie, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, _ := claims["user_id"].(string)
		username, _ := claims["username"].(string)
		logger.Infof("Token decoded successfully")
		return userID, username, nil
	} else {
		logger.Warnf("Invalid JWT token: %v", err)
		return "", "", fiber.ErrUnauthorized
	}
}
