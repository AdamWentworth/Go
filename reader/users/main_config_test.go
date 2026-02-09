package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestReadEnvInt_FallbackCases(t *testing.T) {
	_ = os.Unsetenv("TEST_INT")
	if got := readEnvInt("TEST_INT", 10); got != 10 {
		t.Fatalf("expected fallback for unset value, got %d", got)
	}

	t.Setenv("TEST_INT", "abc")
	if got := readEnvInt("TEST_INT", 10); got != 10 {
		t.Fatalf("expected fallback for non-int value, got %d", got)
	}

	t.Setenv("TEST_INT", "-1")
	if got := readEnvInt("TEST_INT", 10); got != 10 {
		t.Fatalf("expected fallback for non-positive value, got %d", got)
	}

	t.Setenv("TEST_INT", "42")
	if got := readEnvInt("TEST_INT", 10); got != 42 {
		t.Fatalf("expected parsed value 42, got %d", got)
	}
}

func TestNewRateLimiter_EnforcesLimit(t *testing.T) {
	t.Setenv("RATE_LIMIT_MAX", "2")
	t.Setenv("RATE_LIMIT_WINDOW_SEC", "60")

	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user_id", "user-1")
		return c.Next()
	})
	app.Use(newRateLimiter())
	app.Get("/limited", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodGet, "/limited", nil)
		resp, err := app.Test(req, -1)
		if err != nil {
			t.Fatalf("request %d failed: %v", i+1, err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("request %d unexpected status: got %d want %d", i+1, resp.StatusCode, http.StatusOK)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/limited", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request 3 failed: %v", err)
	}
	if resp.StatusCode != http.StatusTooManyRequests {
		t.Fatalf("request 3 unexpected status: got %d want %d", resp.StatusCode, http.StatusTooManyRequests)
	}
}

func TestBodyLimit_Guard(t *testing.T) {
	t.Setenv("MAX_BODY_BYTES", "32")
	bodyLimit := readEnvInt("MAX_BODY_BYTES", 1*1024*1024)

	app := fiber.New(fiber.Config{
		BodyLimit:    bodyLimit,
		ErrorHandler: errorHandler,
	})
	app.Post("/body", func(c *fiber.Ctx) error {
		var payload map[string]any
		if err := c.BodyParser(&payload); err != nil {
			return err
		}
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/body", strings.NewReader(`{"username":"this-payload-is-definitely-longer-than-thirty-two-bytes"}`))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, -1)
	if err == nil {
		if resp.StatusCode != http.StatusRequestEntityTooLarge {
			t.Fatalf("unexpected status: got %d, want %d", resp.StatusCode, http.StatusRequestEntityTooLarge)
		}
		return
	}
	if !strings.Contains(strings.ToLower(err.Error()), "body size exceeds") {
		t.Fatalf("unexpected error for oversized body: %v", err)
	}
}
