// auth.go

package main

import (
	"fmt"
	"net/http"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

var jwtSecret []byte // This is where the JWT_SECRET is stored after loading from .env

// Middleware to verify the JWT
func verifyJWT() gin.HandlerFunc {
	return func(c *gin.Context) {

		// Ensure jwtSecret has been initialized
		if len(jwtSecret) == 0 {
			logrus.Fatal("JWT secret is not initialized") // Fails if not set
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server configuration error"})
			c.Abort()
			return
		}

		tokenString, err := c.Cookie("accessToken") // Get token from cookie
		if err != nil {
			logrus.Error("Authentication failed: JWT token is missing in cookies")
			c.JSON(http.StatusForbidden, gin.H{"error": "Authentication failed"})
			c.Abort()
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil {
			logrus.Error("Authentication failed: JWT token parsing failed")
			c.JSON(http.StatusForbidden, gin.H{"error": "Authentication failed"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(*jwt.MapClaims); ok && token.Valid {
			logrus.Info("Token decoded successfully")
			if userID, ok := (*claims)["user_id"].(string); ok {
				c.Set("user_id", userID)
			} else {
				logrus.Error("Authentication failed: user_id claim missing")
				c.JSON(http.StatusForbidden, gin.H{"error": "Authentication failed"})
				c.Abort()
				return
			}
		} else {
			logrus.Error("Authentication failed: JWT token is invalid")
			c.JSON(http.StatusForbidden, gin.H{"error": "Authentication failed"})
			c.Abort()
			return
		}
	}
}
