// client_manager.go

package main

import (
	"sync"

	"github.com/gofiber/fiber/v3"
)

type Client struct {
	UserID    string
	DeviceID  string
	Channel   chan []byte
	Context   fiber.Ctx
	Connected bool
	closeOnce sync.Once // ensures Channel is closed only once
}

const clientChannelBuffer = 32

var clients = make(map[string]*Client)
var clientsMutex = &sync.Mutex{}

func registerClient(clientID string, client *Client) (replaced bool, active int) {
	clientsMutex.Lock()
	defer clientsMutex.Unlock()

	if existing, ok := clients[clientID]; ok && existing != client {
		existing.Connected = false
		existing.closeOnce.Do(func() {
			close(existing.Channel)
		})
		replaced = true
	}

	clients[clientID] = client
	sseActiveClients.Set(float64(len(clients)))
	return replaced, len(clients)
}

func broadcastToClients(userIDs map[string]bool, sourceDeviceID string, payload []byte) (sent, dropped int) {
	clientsMutex.Lock()
	defer clientsMutex.Unlock()

	for _, client := range clients {
		if !userIDs[client.UserID] || client.DeviceID == sourceDeviceID || !client.Connected {
			continue
		}

		select {
		case client.Channel <- payload:
			sent++
		default:
			dropped++
		}
	}

	return sent, dropped
}
