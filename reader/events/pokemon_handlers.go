// pokemon_handlers.go

package main

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

func GetUpdates(c *fiber.Ctx) error {
	// Get user_id from JWT context
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		logrus.Error("Authentication failed: User ID missing")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// Get device_id from query parameters (optional)
	deviceID := c.Query("device_id")
	if deviceID == "" {
		logrus.Warn("device_id is missing in request")
	}

	// Get timestamp from query parameters
	timestampStr := c.Query("timestamp")
	if timestampStr == "" {
		logrus.Error("timestamp is missing in request")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing timestamp"})
	}

	// Parse the timestamp as an integer (milliseconds since epoch)
	timestampInt, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		logrus.Errorf("Invalid timestamp format: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid timestamp format"})
	}

	logrus.Infof("Fetching updates for user %s since %d", userID, timestampInt)

	// Retrieve Pokémon instances for the user updated after the timestamp
	var instances []PokemonInstance
	if err := db.Where("user_id = ? AND last_update > ?", userID, timestampInt).Find(&instances).Error; err != nil {
		logrus.Errorf("Error retrieving updates: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve updates"})
	}

	// Prepare the response data
	responseData := make(map[string]interface{})
	for _, instance := range instances {
		// Create a map representation of the instance
		instanceMap := map[string]interface{}{
			"pokemon_id":       instance.PokemonID,
			"nickname":         instance.Nickname,
			"cp":               instance.CP,
			"attack_iv":        instance.AttackIV,
			"defense_iv":       instance.DefenseIV,
			"stamina_iv":       instance.StaminaIV,
			"shiny":            instance.Shiny,
			"costume_id":       instance.CostumeID,
			"lucky":            instance.Lucky,
			"shadow":           instance.Shadow,
			"purified":         instance.Purified,
			"fast_move_id":     instance.FastMoveID,
			"charged_move1_id": instance.ChargedMove1ID,
			"charged_move2_id": instance.ChargedMove2ID,
			"weight":           instance.Weight,
			"height":           instance.Height,
			"gender":           instance.Gender,
			"mirror":           instance.Mirror,
			"pref_lucky":       instance.PrefLucky,
			"registered":       instance.Registered,
			"favorite":         instance.Favorite,
			"is_unowned":       instance.IsUnowned,
			"is_owned":         instance.IsOwned,
			"is_for_trade":     instance.IsForTrade,
			"is_wanted":        instance.IsWanted,
			"not_trade_list":   instance.NotTradeList,
			"not_wanted_list":  instance.NotWantedList,
			"location_caught":  instance.LocationCaught,
			"date_added":       instance.DateAdded,
			"date_caught":      instance.DateCaught,
			"friendship_level": instance.FriendshipLevel,
			"last_update":      instance.LastUpdate,
			"wanted_filters":   instance.WantedFilters,
			"trade_filters":    instance.TradeFilters,
		}

		// Add the instance to the response data using its `InstanceID`
		responseData[instance.InstanceID] = instanceMap
	}

	instanceCount := len(responseData)

	// Wrap the responseData in a 'pokemon' property
	response := map[string]interface{}{
		"pokemon": responseData,
	}

	// Log and return the response data
	logrus.Infof("User %s retrieved %d updates", userID, instanceCount)
	return c.Status(fiber.StatusOK).JSON(response)
}

// GetPokemonInstances handles the GET requests to retrieve Pokémon instances for a user
func GetPokemonInstances(c *fiber.Ctx) error {
	userID := c.Params("user_id")
	tokenUserID, ok := c.Locals("user_id").(string) // Extract user_id from context

	// Check if user_id from the token matches the requested user_id
	if !ok || tokenUserID != userID {
		logrus.Error("Authentication failed: User mismatch")
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "User mismatch"})
	}

	// Extract device_id from query parameters
	deviceID := c.Query("device_id")
	if deviceID == "" {
		logrus.Error("device_id is missing in request")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing device_id"})
	}

	// Log the device_id for tracing
	logrus.Infof("Fetching ownership data for user %s from device %s", userID, deviceID)

	// Retrieve the user from the database
	var user User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		// User is not found, log info and return empty response in the same format
		logrus.Infof("User %s not found, returning 0 Pokemon instances", userID)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{})
	}

	// Retrieve Pokémon instances for the user
	var instances []PokemonInstance
	if err := db.Where("user_id = ?", userID).Find(&instances).Error; err != nil {
		logrus.Error("Error retrieving instances")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve instances"})
	}

	// Prepare the response data, even if no instances exist
	responseData := make(map[string]interface{})
	for _, instance := range instances {
		// Create a new map to represent the instance without `user_id` and `instance_id`
		instanceMap := map[string]interface{}{
			"pokemon_id":       instance.PokemonID,
			"nickname":         instance.Nickname,
			"cp":               instance.CP,
			"attack_iv":        instance.AttackIV,
			"defense_iv":       instance.DefenseIV,
			"stamina_iv":       instance.StaminaIV,
			"shiny":            instance.Shiny,
			"costume_id":       instance.CostumeID,
			"lucky":            instance.Lucky,
			"shadow":           instance.Shadow,
			"purified":         instance.Purified,
			"fast_move_id":     instance.FastMoveID,
			"charged_move1_id": instance.ChargedMove1ID,
			"charged_move2_id": instance.ChargedMove2ID,
			"weight":           instance.Weight,
			"height":           instance.Height,
			"gender":           instance.Gender,
			"mirror":           instance.Mirror,
			"pref_lucky":       instance.PrefLucky,
			"registered":       instance.Registered,
			"favorite":         instance.Favorite,
			"is_unowned":       instance.IsUnowned,
			"is_owned":         instance.IsOwned,
			"is_for_trade":     instance.IsForTrade,
			"is_wanted":        instance.IsWanted,
			"not_trade_list":   instance.NotTradeList,
			"not_wanted_list":  instance.NotWantedList,
			"location_caught":  instance.LocationCaught,
			"date_added":       instance.DateAdded,
			"date_caught":      instance.DateCaught,
			"friendship_level": instance.FriendshipLevel,
			"last_update":      instance.LastUpdate,
			"wanted_filters":   instance.WantedFilters,
			"trade_filters":    instance.TradeFilters,
		}

		// Add the instance to the response data using its `InstanceID`
		responseData[instance.InstanceID] = instanceMap
	}

	instanceCount := len(responseData)

	// Log and return the response data, even if empty
	logrus.Infof("User %s retrieved %d Pokemon instances from device %s", user.Username, instanceCount, deviceID)
	return c.Status(fiber.StatusOK).JSON(responseData)
}
