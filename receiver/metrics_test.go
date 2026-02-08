package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestMetricsEndpoint_ExposesPrometheusMetrics(t *testing.T) {
	registerMetrics()

	app := fiber.New(fiber.Config{ErrorHandler: errorHandler})
	app.Use(metricsMiddleware)
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendStatus(http.StatusOK)
	})
	app.Get("/metrics", metricsHandler())

	// Generate at least one request metric sample.
	req1 := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	if _, err := app.Test(req1); err != nil {
		t.Fatalf("health request failed: %v", err)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	resp, err := app.Test(req2)
	if err != nil {
		t.Fatalf("metrics request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read metrics body: %v", err)
	}
	body := string(bodyBytes)
	if !strings.Contains(body, "http_requests_total") {
		t.Fatalf("expected http_requests_total in metrics output")
	}
	if !strings.Contains(body, "http_request_duration_seconds") {
		t.Fatalf("expected http_request_duration_seconds in metrics output")
	}
}
