package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestHealthzAndReadyz(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://pokegonexus.com")
	initAllowedOrigins()
	registerMetrics()

	app := newApp(nil)

	healthReq := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	healthResp, err := app.Test(healthReq, fiber.TestConfig{Timeout: 0})
	if err != nil {
		t.Fatalf("health request failed: %v", err)
	}
	if healthResp.StatusCode != http.StatusOK {
		t.Fatalf("expected /healthz 200, got %d", healthResp.StatusCode)
	}

	readyReq := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	readyResp, err := app.Test(readyReq, fiber.TestConfig{Timeout: 0})
	if err != nil {
		t.Fatalf("ready request failed: %v", err)
	}
	if readyResp.StatusCode != http.StatusServiceUnavailable {
		t.Fatalf("expected /readyz 503 with nil DB, got %d", readyResp.StatusCode)
	}
}

func TestMetricsEndpoint(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://pokegonexus.com")
	initAllowedOrigins()
	registerMetrics()

	app := newApp(nil)

	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	resp, err := app.Test(req, fiber.TestConfig{Timeout: 0})
	if err != nil {
		t.Fatalf("metrics request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected /metrics 200, got %d", resp.StatusCode)
	}
}
