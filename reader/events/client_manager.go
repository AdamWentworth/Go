// client_manager.go

package main

import (
	"sync"

	"github.com/gofiber/fiber/v2"
)

type Client struct {
	UserID    string
	DeviceID  string
	Channel   chan []byte
	Context   *fiber.Ctx
	Connected bool
	closeOnce sync.Once // ensures Channel is closed only once
}

var clients = make(map[string]*Client)
var clientsMutex = &sync.Mutex{}
