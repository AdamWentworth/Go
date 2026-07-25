// sse_handler.go

package main

import (
	"bufio"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/sirupsen/logrus"
)

func sseHandler(c fiber.Ctx) error {
	logrus.Infof("SSE handler invoked for username %v", c.Locals("username"))
	// Get user_id from context
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized")
	}

	// Get device_id from context or query parameter
	deviceID, ok := c.Locals("device_id").(string)
	if !ok || deviceID == "" {
		// Attempt to get device_id from query parameter
		deviceID = c.Query("device_id")
		if deviceID == "" {
			return c.Status(fiber.StatusBadRequest).SendString("Missing device_id")
		}
	}

	// Create a unique client ID
	clientID := fmt.Sprintf("%s:%s", userID, deviceID)

	// Create a new client
	client := &Client{
		UserID:    userID,
		DeviceID:  deviceID,
		Channel:   make(chan []byte, clientChannelBuffer),
		Connected: true,
	}

	replaced, active := registerClient(clientID, client)
	logrus.Infof(
		"Client connected: UserID=%s, DeviceID=%s, ActiveClients=%d, Replaced=%t",
		client.UserID,
		client.DeviceID,
		active,
		replaced,
	)

	// Set necessary headers for SSE
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")

	// Use SetBodyStreamWriter for streaming
	c.RequestCtx().SetBodyStreamWriter(func(w *bufio.Writer) {
		defer handleClientDisconnect(clientID, client)

		// Send initial event to confirm connection
		if _, err := fmt.Fprintf(w, "event: connected\ndata: Connected to SSE stream\n\n"); err != nil {
			return
		}
		if err := w.Flush(); err != nil {
			return
		}

		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case msg, ok := <-client.Channel:
				if !ok {
					return
				}
				if _, err := fmt.Fprintf(w, "data: %s\n\n", msg); err != nil {
					return
				}
			case <-ticker.C:
				if _, err := fmt.Fprint(w, ": heartbeat\n\n"); err != nil {
					return
				}
			}

			if err := w.Flush(); err != nil {
				return
			}
		}
	})

	// Return nil to keep the connection open
	return nil
}

func handleClientDisconnect(clientID string, client *Client) {
	clientsMutex.Lock()
	client.Connected = false
	if current, ok := clients[clientID]; ok && current == client {
		delete(clients, clientID)
	}
	sseActiveClients.Set(float64(len(clients)))
	clientsMutex.Unlock()

	// Close the client channel only once using sync.Once
	client.closeOnce.Do(func() {
		close(client.Channel)
	})

	logrus.Infof("Client disconnected: UserID=%s, DeviceID=%s", client.UserID, client.DeviceID)
}
