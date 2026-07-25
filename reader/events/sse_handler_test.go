package main

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
)

func TestSSEHandler_UnauthorizedWithoutUserID(t *testing.T) {
	app := fiber.New()
	app.Get("/api/sse", sseHandler)

	req := httptest.NewRequest(fiber.MethodGet, "/api/sse", nil)
	resp, err := app.Test(req, fiber.TestConfig{Timeout: 0})
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != fiber.StatusUnauthorized {
		t.Fatalf("expected %d, got %d", fiber.StatusUnauthorized, resp.StatusCode)
	}
}

func TestSSEHandler_BadRequestWithoutDeviceID(t *testing.T) {
	app := fiber.New()
	app.Use(func(c fiber.Ctx) error {
		c.Locals("user_id", "u-1")
		return c.Next()
	})
	app.Get("/api/sse", sseHandler)

	req := httptest.NewRequest(fiber.MethodGet, "/api/sse", nil)
	resp, err := app.Test(req, fiber.TestConfig{Timeout: 0})
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

func TestRegisterClient_ReplacesSameDeviceWithoutDeletingReplacement(t *testing.T) {
	origClients := clients
	clients = make(map[string]*Client)
	defer func() {
		clients = origClients
		sseActiveClients.Set(float64(len(origClients)))
	}()

	first := &Client{
		UserID:    "u-1",
		DeviceID:  "d-1",
		Channel:   make(chan []byte, clientChannelBuffer),
		Connected: true,
	}
	second := &Client{
		UserID:    "u-1",
		DeviceID:  "d-1",
		Channel:   make(chan []byte, clientChannelBuffer),
		Connected: true,
	}

	replaced, active := registerClient("u-1:d-1", first)
	if replaced || active != 1 {
		t.Fatalf("expected first registration with one active client, replaced=%t active=%d", replaced, active)
	}

	replaced, active = registerClient("u-1:d-1", second)
	if !replaced || active != 1 {
		t.Fatalf("expected replacement with one active client, replaced=%t active=%d", replaced, active)
	}
	if first.Connected {
		t.Fatal("expected replaced client to be disconnected")
	}
	if _, ok := <-first.Channel; ok {
		t.Fatal("expected replaced client channel to be closed")
	}

	handleClientDisconnect("u-1:d-1", first)
	if current := clients["u-1:d-1"]; current != second {
		t.Fatal("disconnecting the stale stream removed its replacement")
	}

	handleClientDisconnect("u-1:d-1", second)
	if len(clients) != 0 {
		t.Fatalf("expected no active clients, got %d", len(clients))
	}
}

func TestBroadcastToClients_RoutesOnlyToOtherEligibleDevices(t *testing.T) {
	origClients := clients
	clients = map[string]*Client{
		"u-1:origin": {
			UserID:    "u-1",
			DeviceID:  "origin",
			Channel:   make(chan []byte, 1),
			Connected: true,
		},
		"u-1:other": {
			UserID:    "u-1",
			DeviceID:  "other",
			Channel:   make(chan []byte, 1),
			Connected: true,
		},
		"u-2:other": {
			UserID:    "u-2",
			DeviceID:  "other-user-device",
			Channel:   make(chan []byte, 1),
			Connected: true,
		},
	}
	defer func() { clients = origClients }()

	payload := []byte(`{"pokemon":{"instance-1":{"is_caught":true}}}`)
	sent, dropped := broadcastToClients(map[string]bool{"u-1": true}, "origin", payload)
	if sent != 1 || dropped != 0 {
		t.Fatalf("expected one delivery and no drops, sent=%d dropped=%d", sent, dropped)
	}

	if got := <-clients["u-1:other"].Channel; string(got) != string(payload) {
		t.Fatalf("unexpected payload: %s", got)
	}

	select {
	case <-clients["u-1:origin"].Channel:
		t.Fatal("originating device received its own update")
	default:
	}
	select {
	case <-clients["u-2:other"].Channel:
		t.Fatal("unrelated user received the update")
	default:
	}
}

func TestBroadcastToClients_ReportsSaturatedClient(t *testing.T) {
	origClients := clients
	fullChannel := make(chan []byte, 1)
	fullChannel <- []byte("already queued")
	clients = map[string]*Client{
		"u-1:other": {
			UserID:    "u-1",
			DeviceID:  "other",
			Channel:   fullChannel,
			Connected: true,
		},
	}
	defer func() { clients = origClients }()

	sent, dropped := broadcastToClients(map[string]bool{"u-1": true}, "origin", []byte("next"))
	if sent != 0 || dropped != 1 {
		t.Fatalf("expected a saturated client drop, sent=%d dropped=%d", sent, dropped)
	}
}
