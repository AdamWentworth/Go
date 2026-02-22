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

func signAccessToken(t *testing.T, secret []byte, claims AccessTokenClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(secret)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

func newAuthTestApp() *fiber.App {
	app := fiber.New(fiber.Config{
		ReadBufferSize: 16 * 1024,
	})
	app.Use(verifyJWT)
	app.Get("/ok", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"user_id":   c.Locals("user_id"),
			"username":  c.Locals("username"),
			"device_id": c.Locals("device_id"),
		})
	})
	return app
}

func TestVerifyJWT_MissingSecret(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()

	jwtSecret = nil
	app := newAuthTestApp()

	req := httptest.NewRequest(fiber.MethodGet, "/ok", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusInternalServerError {
		t.Fatalf("expected %d, got %d", fiber.StatusInternalServerError, resp.StatusCode)
	}
}

func TestVerifyJWT_MissingCookie(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()

	jwtSecret = []byte("test-secret")
	app := newAuthTestApp()

	req := httptest.NewRequest(fiber.MethodGet, "/ok", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected %d, got %d", fiber.StatusForbidden, resp.StatusCode)
	}
}

func TestVerifyJWT_ValidAuthorizationHeaderSetsLocals(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()

	secret := []byte("test-secret")
	jwtSecret = secret
	app := newAuthTestApp()

	claims := AccessTokenClaims{
		UserID:   "user-456",
		Username: "misty",
		DeviceID: "device-auth-header",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}
	token := signAccessToken(t, secret, claims)

	req := httptest.NewRequest(fiber.MethodGet, "/ok", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected %d, got %d", fiber.StatusOK, resp.StatusCode)
	}
}

func TestVerifyJWT_ValidQueryTokenSetsLocals(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()

	secret := []byte("test-secret")
	jwtSecret = secret
	app := newAuthTestApp()

	claims := AccessTokenClaims{
		UserID:   "user-789",
		Username: "brock",
		DeviceID: "device-query",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}
	token := signAccessToken(t, secret, claims)

	req := httptest.NewRequest(fiber.MethodGet, "/ok?access_token="+token, nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected %d, got %d", fiber.StatusOK, resp.StatusCode)
	}
}

func TestVerifyJWT_OversizedCookie(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()

	jwtSecret = []byte("test-secret")
	app := newAuthTestApp()

	req := httptest.NewRequest(fiber.MethodGet, "/ok", nil)
	req.Header.Set("Cookie", "accessToken="+strings.Repeat("a", 9000))

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusForbidden {
		t.Fatalf("expected %d, got %d", fiber.StatusForbidden, resp.StatusCode)
	}
}

func TestVerifyJWT_ValidCookieSetsLocals(t *testing.T) {
	original := jwtSecret
	defer func() { jwtSecret = original }()

	secret := []byte("test-secret")
	jwtSecret = secret
	app := newAuthTestApp()

	claims := AccessTokenClaims{
		UserID:   "user-123",
		Username: "adam",
		DeviceID: "device-abc",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}
	token := signAccessToken(t, secret, claims)

	req := httptest.NewRequest(fiber.MethodGet, "/ok", nil)
	req.Header.Set("Cookie", "accessToken="+token)

	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("expected %d, got %d", fiber.StatusOK, resp.StatusCode)
	}

	var body map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if body["user_id"] != "user-123" {
		t.Fatalf("expected user_id user-123, got %q", body["user_id"])
	}
	if body["username"] != "adam" {
		t.Fatalf("expected username adam, got %q", body["username"])
	}
	if body["device_id"] != "device-abc" {
		t.Fatalf("expected device_id device-abc, got %q", body["device_id"])
	}
}
