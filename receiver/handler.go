package main

import (
	"encoding/json"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func handleBatchedUpdates(c *fiber.Ctx) error {
	if c.Method() == http.MethodOptions {
		c.Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Set("Access-Control-Allow-Credentials", "true")
		return c.SendStatus(http.StatusOK)
	}

	// Verify JWT token and extract user details
	userID, username, deviceID, err := verifyAccessToken(c)
	if err != nil {
		logger.Warnf("Unauthorized access attempt: %v", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "Unauthorized"})
	}

	// Parse incoming request data
	var requestData map[string]interface{}
	if err := c.BodyParser(&requestData); err != nil {
		logger.Errorf("Failed to parse request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Bad Request"})
	}

	// Extract the top-level fields from the requestData
	location, _ := requestData["location"].(map[string]interface{})

	// It's up to your client code to ensure these are arrays
	// If they're missing or empty, default to empty arrays
	rawPokemonUpdates, okPoke := requestData["pokemonUpdates"].([]interface{})
	if !okPoke {
		rawPokemonUpdates = []interface{}{} // default
	}
	rawTradeUpdates, okTrade := requestData["tradeUpdates"].([]interface{})
	if !okTrade {
		rawTradeUpdates = []interface{}{} // default
	}

	traceID := uuid.New().String()

	// Prepare data to send to Kafka
	data := map[string]interface{}{
		"user_id":        userID,
		"username":       username,
		"device_id":      deviceID,
		"trace_id":       traceID,
		"location":       location,
		"pokemonUpdates": rawPokemonUpdates,
		"tradeUpdates":   rawTradeUpdates,
	}

	message, err := json.Marshal(data)
	if err != nil {
		logger.Errorf("Failed to marshal data to JSON: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Internal Server Error"})
	}

	// Produce to Kafka
	err = produceToKafka(message)
	if err != nil {
		logger.Errorf("Failed to produce to Kafka: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Internal Server Error"})
	}

	// Respond to the client
	c.Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Set("Access-Control-Allow-Credentials", "true")
	logger.Infof(
		"User %s sent %d Pokemon updates + %d Trade updates to Kafka",
		username, len(rawPokemonUpdates), len(rawTradeUpdates),
	)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Batched updates successfully processed"})
}
