package main

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

func newSSETokenTestApp() *fiber.App {
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user_id", "u-123")
		c.Locals("username", "ash")
		return c.Next()
	})
	app.Get("/api/sse-token", issueSSEToken)
	return app
}

func TestIssueSSEToken_ReturnsSignedToken(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()
	jwtSecret = []byte("test-secret")

	app := newSSETokenTestApp()
	req := httptest.NewRequest(fiber.MethodGet, "/api/sse-token?device_id=device-42", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var body struct {
		Token            string `json:"token"`
		ExpiresInSeconds int    `json:"expires_in_seconds"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode failed: %v", err)
	}
	if strings.TrimSpace(body.Token) == "" {
		t.Fatalf("expected non-empty token")
	}
	if body.ExpiresInSeconds <= 0 {
		t.Fatalf("expected positive ttl")
	}

	claims := &AccessTokenClaims{}
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	token, err := parser.ParseWithClaims(body.Token, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		t.Fatalf("token parse failed: %v", err)
	}
	if !token.Valid {
		t.Fatalf("expected valid token")
	}
	if claims.TokenUse != "sse" {
		t.Fatalf("expected token_use sse, got %q", claims.TokenUse)
	}
	if claims.DeviceID != "device-42" {
		t.Fatalf("expected device_id device-42, got %q", claims.DeviceID)
	}
}

func TestIssueSSEToken_RejectsMissingDeviceID(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()
	jwtSecret = []byte("test-secret")

	app := newSSETokenTestApp()
	req := httptest.NewRequest(fiber.MethodGet, "/api/sse-token", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected %d, got %d", fiber.StatusBadRequest, resp.StatusCode)
	}
}

func TestIssueSSEToken_RejectsWithoutSecret(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()
	jwtSecret = nil

	app := newSSETokenTestApp()
	req := httptest.NewRequest(fiber.MethodGet, "/api/sse-token?device_id=device-1", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusInternalServerError {
		t.Fatalf("expected %d, got %d", fiber.StatusInternalServerError, resp.StatusCode)
	}
}

func TestIssueSSEToken_UsesDeviceIDFromLocalsFallback(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()
	jwtSecret = []byte("test-secret")

	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user_id", "u-123")
		c.Locals("username", "ash")
		c.Locals("device_id", "device-local")
		return c.Next()
	})
	app.Get("/api/sse-token", issueSSEToken)

	req := httptest.NewRequest(fiber.MethodGet, "/api/sse-token", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var body struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode failed: %v", err)
	}

	claims := &AccessTokenClaims{}
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	token, err := parser.ParseWithClaims(body.Token, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		t.Fatalf("expected valid token, err=%v", err)
	}
	if claims.DeviceID != "device-local" {
		t.Fatalf("expected device-local device_id, got %q", claims.DeviceID)
	}
	if claims.ExpiresAt == nil || claims.ExpiresAt.Time.Before(time.Now()) {
		t.Fatalf("expected future expiration")
	}
}
