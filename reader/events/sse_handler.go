// sse_handler.go

package main

import (
	"bufio"
	"fmt"

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
			// Handle error, possibly client disconnected
			handleClientDisconnect(clientID, client)
			return
		}
		if err := w.Flush(); err != nil {
			// Handle error, possibly client disconnected
			handleClientDisconnect(clientID, client)
			return
		}

		// Listen for messages using for-range loop
		for msg := range client.Channel {
			// Write message to the client
			if _, err := fmt.Fprintf(w, "data: %s\n\n", msg); err != nil {
				// Handle error, possibly client disconnected
				handleClientDisconnect(clientID, client)
				return
			}
			if err := w.Flush(); err != nil {
				// Handle error, possibly client disconnected
				handleClientDisconnect(clientID, client)
				return
			}
		}

		// When the channel is closed, exit the function
	})

	// Return nil to keep the connection open
	return nil
}

func handleClientDisconnect(clientID string, client *Client) {
	clientsMutex.Lock()
	client.Connected = false
	delete(clients, clientID)
	clientsMutex.Unlock()

	// Close the channel to signal the for-range loop to exit
	close(client.Channel)

	logrus.Infof("Client disconnected: UserID=%s, DeviceID=%s", client.UserID, client.DeviceID)
}
