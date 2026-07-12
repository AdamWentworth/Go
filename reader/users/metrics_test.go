package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestMetricsEndpointUsesSharedHTTPMetricNames(t *testing.T) {
	app := fiber.New()
	registerMetrics()
	app.Use(metricsMiddleware)
	app.Get("/healthz", func(c fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
	})
	app.Get("/metrics", metricsHandler())

	healthReq := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	healthResp, err := app.Test(healthReq, fiber.TestConfig{Timeout: 0})
	if err != nil {
		t.Fatalf("health request failed: %v", err)
	}
	if healthResp.StatusCode != http.StatusOK {
		t.Fatalf("health expected 200, got %d", healthResp.StatusCode)
	}

	metricsReq := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	metricsResp, err := app.Test(metricsReq, fiber.TestConfig{Timeout: 0})
	if err != nil {
		t.Fatalf("metrics request failed: %v", err)
	}
	if metricsResp.StatusCode != http.StatusOK {
		t.Fatalf("metrics expected 200, got %d", metricsResp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(metricsResp.Body)
	if err != nil {
		t.Fatalf("read metrics body: %v", err)
	}
	body := string(bodyBytes)
	for _, want := range []string{"http_requests_total", "http_request_duration_seconds"} {
		if !strings.Contains(body, want) {
			t.Fatalf("expected %s in metrics output", want)
		}
	}
	for _, legacy := range []string{"users_http_requests_total", "users_http_request_duration_seconds"} {
		if strings.Contains(body, legacy) {
			t.Fatalf("did not expect legacy metric name %s in metrics output", legacy)
		}
	}
}
