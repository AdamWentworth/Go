package main

import (
	"net/http/httptest"
	"testing"

	"gorm.io/gorm"
)

func TestHealthzReadyzAndMetrics(t *testing.T) {
	// Keep DB nil for readiness-negative test.
	db = nil
	jwtSecret = []byte("test-secret")
	allowedOrigins = map[string]struct{}{}

	app := newApp()

	healthReq := httptest.NewRequest("GET", "/healthz", nil)
	healthResp, err := app.Test(healthReq)
	if err != nil {
		t.Fatalf("healthz app.Test: %v", err)
	}
	if healthResp.StatusCode != 200 {
		t.Fatalf("healthz expected 200, got %d", healthResp.StatusCode)
	}

	readyReq := httptest.NewRequest("GET", "/readyz", nil)
	readyResp, err := app.Test(readyReq)
	if err != nil {
		t.Fatalf("readyz app.Test: %v", err)
	}
	if readyResp.StatusCode != 503 {
		t.Fatalf("readyz expected 503 with nil db, got %d", readyResp.StatusCode)
	}

	metricsReq := httptest.NewRequest("GET", "/metrics", nil)
	metricsResp, err := app.Test(metricsReq)
	if err != nil {
		t.Fatalf("metrics app.Test: %v", err)
	}
	if metricsResp.StatusCode != 200 {
		t.Fatalf("metrics expected 200, got %d", metricsResp.StatusCode)
	}
}

// Sanity check for dbReady helper when db is nil.
func TestDBReadyNil(t *testing.T) {
	db = (*gorm.DB)(nil)
	if dbReady() {
		t.Fatalf("dbReady should be false when db is nil")
	}
}
