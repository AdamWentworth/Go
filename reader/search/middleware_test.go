package main

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestCORSMiddleware_AllowsConfiguredOrigin(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://pokemongonexus.com")
	initAllowedOrigins()

	app := fiber.New()
	app.Use(corsMiddleware)
	app.Get("/ok", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })

	req := httptest.NewRequest("GET", "/ok", nil)
	req.Header.Set("Origin", "https://pokemongonexus.com")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}

	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "https://pokemongonexus.com" {
		t.Fatalf("unexpected allow-origin header: %q", got)
	}
}

func TestCORSMiddleware_RejectsUnknownOrigin(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://pokemongonexus.com")
	initAllowedOrigins()

	app := fiber.New()
	app.Use(corsMiddleware)
	app.Get("/ok", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })

	req := httptest.NewRequest("GET", "/ok", nil)
	req.Header.Set("Origin", "https://evil.example")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}

	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("expected empty allow-origin header, got %q", got)
	}
}

func TestCORSMiddleware_OPTIONS(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://pokemongonexus.com")
	initAllowedOrigins()

	app := fiber.New()
	app.Use(corsMiddleware)
	app.Get("/ok", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })

	req := httptest.NewRequest("OPTIONS", "/ok", nil)
	req.Header.Set("Origin", "https://pokemongonexus.com")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}

	if resp.StatusCode != fiber.StatusNoContent {
		t.Fatalf("expected 204, got %d", resp.StatusCode)
	}
}
