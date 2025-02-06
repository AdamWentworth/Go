// middleware.go

package main

import (
	"github.com/gofiber/fiber/v2"
)

func corsMiddleware(c *fiber.Ctx) error {
	allowedOrigins := map[string]bool{
		"http://localhost:3000":          true,
		"https://pokemongonexus.com":     true,
		"https://www.pokemongonexus.com": true,
	}

	origin := c.Get("Origin")
	if allowedOrigins[origin] {
		c.Set("Access-Control-Allow-Origin", origin)
	}

	c.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Cache-Control")
	c.Set("Access-Control-Allow-Credentials", "true")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")

	if c.Method() == fiber.MethodOptions {
		return c.SendStatus(fiber.StatusNoContent)
	}

	return c.Next()
}
