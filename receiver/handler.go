// handler.go
package main

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func handleBatchedUpdates(c *gin.Context) {
	if c.Request.Method == http.MethodOptions {
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Status(http.StatusOK)
		return
	}

	// Verify JWT token
	userID, username, err := verifyAccessToken(c.Request)
	if err != nil {
		logger.Warnf("Unauthorized access attempt: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}

	// Parse incoming request data
	var requestData map[string]interface{}
	err = c.ShouldBindJSON(&requestData)
	if err != nil {
		logger.Errorf("Failed to parse request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad Request"})
		return
	}

	// Extract location data
	location, _ := requestData["location"].(map[string]interface{})
	// Extract Pokémon updates (everything else except "location")
	pokemonUpdates := make(map[string]interface{})
	for key, value := range requestData {
		if key != "location" {
			pokemonUpdates[key] = value
		}
	}

	// Ensure Pokémon data is present
	if len(pokemonUpdates) == 0 {
		logger.Warn("No Pokémon data found in request")
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad Request - No Pokémon data"})
		return
	}

	traceID := uuid.New().String()

	// Prepare data to send to Kafka
	data := map[string]interface{}{
		"user_id":  userID,
		"username": username,
		"trace_id": traceID,
		"pokemon":  pokemonUpdates,
		"location": location,
	}

	message, err := json.Marshal(data)
	if err != nil {
		logger.Errorf("Failed to marshal data to JSON: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal Server Error"})
		return
	}

	// Produce data to Kafka
	err = produceToKafka(message)
	if err != nil {
		logger.Errorf("Failed to produce to Kafka: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal Server Error"})
		return
	}

	// Respond to the client
	c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Header("Access-Control-Allow-Credentials", "true")
	c.JSON(http.StatusOK, gin.H{"message": "Batched updates successfully processed"})

	logger.Infof("User %s loaded %d Pokémon into Kafka", username, len(pokemonUpdates))
}
