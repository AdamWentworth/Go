package main

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func newCORSTestApp() *fiber.App {
	app := fiber.New()
	app.Use(corsMiddleware)
	app.Get("/ok", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})
	return app
}

func TestCORSMiddleware_AllowedOrigin(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://allowed.example")
	initAllowedOrigins()

	app := newCORSTestApp()
	req := httptest.NewRequest(fiber.MethodGet, "/ok", nil)
	req.Header.Set("Origin", "https://allowed.example")

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected %d, got %d", fiber.StatusOK, resp.StatusCode)
	}
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "https://allowed.example" {
		t.Fatalf("expected Access-Control-Allow-Origin header to be set, got %q", got)
	}
}

func TestCORSMiddleware_DisallowedOrigin(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://allowed.example")
	initAllowedOrigins()

	app := newCORSTestApp()
	req := httptest.NewRequest(fiber.MethodGet, "/ok", nil)
	req.Header.Set("Origin", "https://blocked.example")

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected %d, got %d", fiber.StatusOK, resp.StatusCode)
	}
	if got := resp.Header.Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("expected Access-Control-Allow-Origin to be empty, got %q", got)
	}
}

func TestCORSMiddleware_OptionsShortCircuit(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://allowed.example")
	initAllowedOrigins()

	app := newCORSTestApp()
	req := httptest.NewRequest(fiber.MethodOptions, "/ok", nil)
	req.Header.Set("Origin", "https://allowed.example")

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusNoContent {
		t.Fatalf("expected %d, got %d", fiber.StatusNoContent, resp.StatusCode)
	}
}
