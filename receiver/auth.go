// auth.go
package main

import (
	"net/http"

	"github.com/golang-jwt/jwt/v4"
)

func verifyAccessToken(r *http.Request) (string, string, error) {
	cookie, err := r.Cookie("accessToken")
	if err != nil {
		logger.Warnf("Access token cookie not found: %v", err)
		return "", "", err
	}

	tokenString := cookie.Value
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil // Use jwtSecret from config.go
	})

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID := claims["user_id"].(string)
		username := claims["username"].(string)
		return userID, username, nil
	} else {
		logger.Warnf("Invalid JWT token: %v", err)
		return "", "", err
	}
}
