// sse_handler.go

package main

import (
	"bufio"
	"fmt"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

func sseHandler(c *fiber.Ctx) error {
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
		Channel:   make(chan []byte),
		Connected: true,
	}

	// Add client to the clients map
	clientsMutex.Lock()
	clients[clientID] = client
	clientsMutex.Unlock()

	// Set necessary headers for SSE
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")

	// Use SetBodyStreamWriter for streaming
	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		// Send initial event to confirm connection
		if _, err := fmt.Fprintf(w, "event: connected\ndata: Connected to SSE stream\n\n"); err != nil {
			handleClientDisconnect(clientID, client)
			return
		}
		if err := w.Flush(); err != nil {
			handleClientDisconnect(clientID, client)
			return
		}

		// Start the heartbeat goroutine to keep the connection alive
		heartbeatDone := make(chan struct{})
		var hbOnce sync.Once
		closeHeartbeat := func() {
			hbOnce.Do(func() {
				close(heartbeatDone)
			})
		}

		go func() {
			ticker := time.NewTicker(30 * time.Second)
			defer ticker.Stop()
			for {
				select {
				case <-ticker.C:
					// Send a heartbeat comment (SSE comments start with ':')
					if _, err := fmt.Fprintf(w, ": heartbeat\n\n"); err != nil {
						closeHeartbeat()
						return
					}
					if err := w.Flush(); err != nil {
						closeHeartbeat()
						return
					}
				case <-heartbeatDone:
					return
				}
			}
		}()

		// Listen for messages from the client channel
		for msg := range client.Channel {
			if _, err := fmt.Fprintf(w, "data: %s\n\n", msg); err != nil {
				handleClientDisconnect(clientID, client)
				closeHeartbeat()
				return
			}
			if err := w.Flush(); err != nil {
				handleClientDisconnect(clientID, client)
				closeHeartbeat()
				return
			}
		}

		// When the channel is closed, signal the heartbeat goroutine to stop
		closeHeartbeat()
	})

	// Return nil to keep the connection open
	return nil
}

func handleClientDisconnect(clientID string, client *Client) {
	clientsMutex.Lock()
	// Mark client as disconnected and remove from the clients map
	client.Connected = false
	delete(clients, clientID)
	clientsMutex.Unlock()

	// Close the client channel only once using sync.Once
	client.closeOnce.Do(func() {
		close(client.Channel)
	})

	logrus.Infof("Client disconnected: UserID=%s, DeviceID=%s", client.UserID, client.DeviceID)
}
