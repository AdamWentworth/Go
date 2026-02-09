package main

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestSSEHandler_UnauthorizedWithoutUserID(t *testing.T) {
	app := fiber.New()
	app.Get("/api/sse", sseHandler)

	req := httptest.NewRequest(fiber.MethodGet, "/api/sse", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", fiber.StatusUnauthorized, resp.StatusCode)
	}
}

func TestSSEHandler_BadRequestWithoutDeviceID(t *testing.T) {
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals("user_id", "u-1")
		return c.Next()
	})
	app.Get("/api/sse", sseHandler)

	req := httptest.NewRequest(fiber.MethodGet, "/api/sse", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected %d, got %d", fiber.StatusBadRequest, resp.StatusCode)
	}
}

func TestHandleClientDisconnect_Idempotent(t *testing.T) {
	origClients := clients
	clients = make(map[string]*Client)
	defer func() { clients = origClients }()

	client := &Client{
		UserID:    "u-1",
		DeviceID:  "d-1",
		Channel:   make(chan []byte),
		Connected: true,
	}
	clients["u-1:d-1"] = client

	handleClientDisconnect("u-1:d-1", client)
	if client.Connected {
		t.Fatalf("expected client to be marked disconnected")
	}
	if _, ok := clients["u-1:d-1"]; ok {
		t.Fatalf("expected client removed from registry")
	}

	// should not panic on second call
	handleClientDisconnect("u-1:d-1", client)

	select {
	case _, ok := <-client.Channel:
		if ok {
			t.Fatalf("expected channel to be closed")
		}
	default:
		// channel may already be drained, but should still be closed.
		select {
		case _, ok := <-client.Channel:
			if ok {
				t.Fatalf("expected channel to be closed")
			}
		default:
			// no buffered value and non-blocking read defaulted; attempt send to verify closed.
			defer func() {
				if r := recover(); r == nil {
					t.Fatalf("expected send on closed channel panic")
				}
			}()
			client.Channel <- []byte("x")
		}
	}
}
