// pokemon_handlers.go

package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// GetPokemonInstances handles the GET requests to retrieve Pokémon instances for a user
func GetPokemonInstances(c *gin.Context) {

	userID := c.Param("user_id")
	tokenUserID := c.GetString("user_id") // Extract user_id from context

	// Check if user_id from the token matches the requested user_id
	if tokenUserID != userID {
		logrus.Error("Authentication failed: User mismatch")
		c.JSON(http.StatusForbidden, gin.H{"error": "User mismatch"})
		return
	}

	// Retrieve the user from the database
	var user User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		// User is not found, log info and return empty response in the same format
		logrus.Infof("User %s not found, returning 0 Pokemon instances", userID)
		c.JSON(http.StatusOK, gin.H{})
		return
	}

	// Retrieve Pokémon instances for the user
	var instances []PokemonInstance
	if err := db.Where("user_id = ?", userID).Find(&instances).Error; err != nil {
		logrus.Error("Error retrieving instances")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve instances"})
		return
	}

	// Prepare the response data, even if no instances exist
	responseData := make(map[string]interface{})
	for _, instance := range instances {
		instance.User = nil    // Remove the user field like Django does
		instance.TraceID = nil // Remove TraceID

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
	logrus.Infof("User %s retrieved %d Pokemon instances with status 200", user.Username, instanceCount)
	c.JSON(http.StatusOK, responseData)
}
