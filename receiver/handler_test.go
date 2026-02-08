package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

func TestHandleBatchedUpdates_Success(t *testing.T) {
	jwtSecret = "test-secret"
	token := newAccessTokenForTest(t, jwt.SigningMethodHS256, AccessTokenClaims{
		UserID:   "user-1",
		Username: "ash",
		DeviceID: "device-1",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	})

	called := false
	var captured []byte
	prev := kafkaProducerFunc
	kafkaProducerFunc = func(data []byte) error {
		called = true
		captured = append([]byte(nil), data...)
		return nil
	}
	t.Cleanup(func() { kafkaProducerFunc = prev })

	app := fiber.New(fiber.Config{ErrorHandler: errorHandler})
	app.Post("/api/batchedUpdates", handleBatchedUpdates)

	reqBody := `{"location":{"latitude":1.23,"longitude":4.56},"pokemonUpdates":[{"id":"p1"}],"tradeUpdates":[{"id":"t1"}]}`
	req := httptest.NewRequest(http.MethodPost, "/api/batchedUpdates", strings.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(&http.Cookie{Name: "accessToken", Value: token})

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}
	if !called {
		t.Fatal("expected kafka producer to be called")
	}

	var got map[string]any
	if err := json.Unmarshal(captured, &got); err != nil {
		t.Fatalf("unmarshal kafka payload: %v", err)
	}
	if got["user_id"] != "user-1" {
		t.Fatalf("expected user_id=user-1, got %v", got["user_id"])
	}
}

func TestHandleBatchedUpdates_RejectsMalformedJSON(t *testing.T) {
	jwtSecret = "test-secret"
	token := newAccessTokenForTest(t, jwt.SigningMethodHS256, AccessTokenClaims{
		UserID:   "user-1",
		Username: "ash",
		DeviceID: "device-1",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	})

	called := false
	prev := kafkaProducerFunc
	kafkaProducerFunc = func(data []byte) error {
		called = true
		return nil
	}
	t.Cleanup(func() { kafkaProducerFunc = prev })

	app := fiber.New(fiber.Config{ErrorHandler: errorHandler})
	app.Post("/api/batchedUpdates", handleBatchedUpdates)

	req := httptest.NewRequest(http.MethodPost, "/api/batchedUpdates", strings.NewReader(`{"pokemonUpdates":[`))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(&http.Cookie{Name: "accessToken", Value: token})

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.StatusCode)
	}
	if called {
		t.Fatal("kafka producer should not be called on malformed JSON")
	}
}

func TestHandleBatchedUpdates_RejectsHugeBatch(t *testing.T) {
	jwtSecret = "test-secret"
	token := newAccessTokenForTest(t, jwt.SigningMethodHS256, AccessTokenClaims{
		UserID:   "user-1",
		Username: "ash",
		DeviceID: "device-1",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	})

	called := false
	prev := kafkaProducerFunc
	kafkaProducerFunc = func(data []byte) error {
		called = true
		return nil
	}
	t.Cleanup(func() { kafkaProducerFunc = prev })

	updates := make([]map[string]any, maxUpdatesPerRequest+1)
	for i := range updates {
		updates[i] = map[string]any{"id": i}
	}
	raw, err := json.Marshal(map[string]any{
		"pokemonUpdates": updates,
	})
	if err != nil {
		t.Fatalf("marshal test payload: %v", err)
	}

	app := fiber.New(fiber.Config{ErrorHandler: errorHandler})
	app.Post("/api/batchedUpdates", handleBatchedUpdates)

	req := httptest.NewRequest(http.MethodPost, "/api/batchedUpdates", strings.NewReader(string(raw)))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(&http.Cookie{Name: "accessToken", Value: token})

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected status 413, got %d", resp.StatusCode)
	}
	if called {
		t.Fatal("kafka producer should not be called on oversized batch")
	}
}
