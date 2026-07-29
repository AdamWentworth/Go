// handler.go

package main

import (
	"bytes"
	"encoding/json"
	"io"
	"regexp"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

const maxUpdatesPerRequest = 5000

var syncBatchIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{1,64}$`)

var kafkaProducerFunc = produceToKafka

type BatchedUpdatesRequest struct {
	SyncBatchID    string         `json:"sync_batch_id"`
	Location       map[string]any `json:"location"`
	PokemonUpdates []any          `json:"pokemonUpdates"`
}

func handleBatchedUpdates(c fiber.Ctx) error {
	traceID := uuid.New().String()
	// Store trace_id in context for middleware logging
	c.Locals("trace_id", traceID)

	// Verify JWT token and extract user details
	userID, username, deviceID, err := verifyAccessToken(c)
	if err != nil {
		logger.WithFields(map[string]interface{}{
			"trace_id": traceID,
			"error":    err.Error(),
		}).Warnf("Unauthorized access attempt: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "Unauthorized"})
	}

	// Store user_id in context for middleware logging
	c.Locals("user_id", userID)

	var requestData BatchedUpdatesRequest
	body := c.Body()
	if len(body) > 0 {
		dec := json.NewDecoder(bytes.NewReader(body))
		dec.UseNumber()
		if err := dec.Decode(&requestData); err != nil {
			logger.WithFields(map[string]interface{}{
				"trace_id": traceID,
				"user_id":  userID,
				"error":    err.Error(),
			}).Errorf("Failed to decode request body: %v", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Bad Request"})
		}

		if err := dec.Decode(&struct{}{}); err != io.EOF {
			logger.WithFields(map[string]interface{}{
				"trace_id": traceID,
				"user_id":  userID,
				"error":    "multiple JSON values in body",
			}).Warn("Rejected malformed request body")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Bad Request"})
		}
	}

	// If they're missing or empty, default to empty arrays.
	if requestData.PokemonUpdates == nil {
		requestData.PokemonUpdates = []any{}
	}
	if requestData.SyncBatchID != "" && !syncBatchIDPattern.MatchString(requestData.SyncBatchID) {
		return c.Status(fiber.StatusBadRequest).
			JSON(fiber.Map{"message": "Invalid sync_batch_id"})
	}
	if len(requestData.PokemonUpdates) > maxUpdatesPerRequest {
		logger.WithFields(map[string]interface{}{
			"trace_id": traceID,
			"user_id":  userID,
			"pokemon":  len(requestData.PokemonUpdates),
		}).Warn("Rejected oversized updates batch")
		return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"message": "Too many updates in a single request"})
	}

	// Prepare data to send to Kafka
	data := map[string]interface{}{
		"sync_batch_id":  requestData.SyncBatchID,
		"user_id":        userID,
		"username":       username,
		"device_id":      deviceID,
		"trace_id":       traceID,
		"location":       requestData.Location,
		"pokemonUpdates": requestData.PokemonUpdates,
	}

	message, err := json.Marshal(data)
	if err != nil {
		logger.WithFields(map[string]interface{}{
			"trace_id": traceID,
			"user_id":  userID,
			"error":    err.Error(),
		}).Errorf("Failed to marshal data to JSON: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Internal Server Error"})
	}

	// Produce to Kafka
	err = kafkaProducerFunc(message)
	if err != nil {
		logger.WithFields(map[string]interface{}{
			"trace_id": traceID,
			"user_id":  userID,
			"error":    err.Error(),
		}).Errorf("Failed to produce to Kafka: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Internal Server Error"})
	}

	// Respond to the client
	// Log successful operation with detailed fields but keeping the same terminal message
	logger.WithFields(map[string]interface{}{
		"trace_id":       traceID,
		"user_id":        userID,
		"device_id":      deviceID,
		"pokemonUpdates": requestData.PokemonUpdates,
		"has_location":   requestData.Location != nil,
	}).Infof(
		"User %s sent %d Pokemon updates to Kafka",
		username, len(requestData.PokemonUpdates),
	)

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Batched updates successfully processed"})
}
