// pokemon_handlers.go

package main

import (
	"math"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

// GetPokemonInstances handles the GET requests to retrieve Pokémon instances for a user
func GetPokemonInstances(c *fiber.Ctx) error {
	userID := c.Params("user_id")
	tokenUserID := c.Locals("user_id").(string) // Extract user_id from context

	// Check if user_id from the token matches the requested user_id
	if tokenUserID != userID {
		logrus.Error("Authentication failed: User mismatch")
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "User mismatch"})
	}

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
	logrus.Infof("User %s retrieved %d Pokemon instances", user.Username, instanceCount)
	return c.Status(fiber.StatusOK).JSON(responseData)
}

// Haversine function to calculate the distance between two latitude/longitude pairs
func haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth radius in kilometers
	lat1Rad := lat1 * (math.Pi / 180)
	lat2Rad := lat2 * (math.Pi / 180)
	deltaLat := (lat2 - lat1) * (math.Pi / 180)
	deltaLon := (lon2 - lon1) * (math.Pi / 180)

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

func SearchPokemonInstances(c *fiber.Ctx) error {
	// Extract query parameters
	pokemonIDStr := c.Query("pokemon_id")
	shinyStr := c.Query("shiny")
	shadowStr := c.Query("shadow")
	costumeIDStr := c.Query("costume_id")
	ownership := c.Query("ownership")
	limitStr := c.Query("limit")
	rangeKMStr := c.Query("range_km")
	latitudeStr := c.Query("latitude")
	longitudeStr := c.Query("longitude")

	logrus.Infof("Received search query with params: pokemon_id=%s, shiny=%s, shadow=%s, costume_id=%s, ownership=%s, limit=%s, range_km=%s, latitude=%s, longitude=%s",
		pokemonIDStr, shinyStr, shadowStr, costumeIDStr, ownership, limitStr, rangeKMStr, latitudeStr, longitudeStr)

	// Parse parameters into appropriate types
	var pokemonID int
	var err error
	if pokemonIDStr != "" {
		pokemonID, err = strconv.Atoi(pokemonIDStr)
		if err != nil {
			logrus.Error("Invalid pokemon_id: ", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid pokemon_id"})
		}
	}

	var shiny bool
	if shinyStr != "" {
		shiny, err = strconv.ParseBool(shinyStr)
		if err != nil {
			logrus.Error("Invalid shiny value: ", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid shiny value"})
		}
	}

	var shadow bool
	if shadowStr != "" {
		shadow, err = strconv.ParseBool(shadowStr)
		if err != nil {
			logrus.Error("Invalid shadow value: ", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid shadow value"})
		}
	}

	// Determine the value of costumeID based on the input
	var costumeID *int
	if costumeIDStr != "" && costumeIDStr != "null" {
		cid, err := strconv.Atoi(costumeIDStr)
		if err != nil {
			logrus.Error("Invalid costume_id: ", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid costume_id"})
		}
		costumeID = &cid
	}

	var limit int = 25 // Default limit
	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			logrus.Error("Invalid limit value: ", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid limit"})
		}
	}

	var rangeKM float64 = 5 // Default range in km
	if rangeKMStr != "" {
		rangeKM, err = strconv.ParseFloat(rangeKMStr, 64)
		if err != nil {
			logrus.Error("Invalid range_km: ", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid range_km"})
		}
	}

	var latitude, longitude float64
	if latitudeStr != "" && longitudeStr != "" {
		latitude, err = strconv.ParseFloat(latitudeStr, 64)
		if err != nil {
			logrus.Error("Invalid latitude: ", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid latitude"})
		}
		longitude, err = strconv.ParseFloat(longitudeStr, 64)
		if err != nil {
			logrus.Error("Invalid longitude: ", err)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid longitude"})
		}
	}

	// Start building the query
	query := db.Preload("User").Model(&PokemonInstance{})

	// Apply filters based on parameters
	if pokemonIDStr != "" {
		query = query.Where("pokemon_id = ?", pokemonID)
	}

	if shinyStr != "" {
		query = query.Where("shiny = ?", shiny)
	}

	if shadowStr != "" {
		query = query.Where("shadow = ?", shadow)
	}

	// Apply costume_id filtering logic
	if costumeIDStr == "" || costumeIDStr == "null" {
		// If costumeID is not specified or explicitly set to "null", search for instances with costume_id IS NULL
		query = query.Where("costume_id IS NULL")
	} else if costumeID != nil {
		// Otherwise, search for the specified costume_id
		query = query.Where("costume_id = ?", *costumeID)
	}

	// Ownership status
	if ownership != "" {
		switch ownership {
		case "trade":
			query = query.Where("is_for_trade = ?", true)
		case "owned":
			query = query.Where("is_owned = ?", true)
		case "wanted":
			query = query.Where("is_wanted = ?", true)
		default:
			logrus.Error("Invalid ownership value")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ownership value"})
		}
	}

	// Handle location and range filtering
	if latitudeStr != "" && longitudeStr != "" {
		// Use GORM's association to join the User table
		// Adjust WHERE clauses to use "User" instead of "users"
		query = query.Joins("User").
			Where("User.latitude IS NOT NULL AND User.longitude IS NOT NULL").
			Where(`
			6371 * 2 * ASIN(
				SQRT(
					POWER(SIN(RADIANS(User.latitude - ?) / 2), 2) +
					COS(RADIANS(?)) * COS(RADIANS(User.latitude)) *
					POWER(SIN(RADIANS(User.longitude - ?) / 2), 2)
				)
			) < ?`, latitude, latitude, longitude, rangeKM)
	}

	// Apply the limit
	query = query.Limit(limit)

	// Execute the query
	var instances []PokemonInstance
	if err := query.Find(&instances).Error; err != nil {
		logrus.Error("Error retrieving instances: ", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve instances"})
	}

	// Check if no instances were found
	if len(instances) == 0 {
		logrus.Info("No Pokemon instances found for the given parameters")
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "No Pokemon instances found"})
	}

	logrus.Infof("Found %d Pokemon instances", len(instances))

	// Prepare the response data (object of objects, keyed by instance_id)
	responseData := make(map[string]interface{})
	for _, instance := range instances {
		// Ensure that User is not nil and calculate the distance
		var userDistance float64
		var userID, username string
		var userLatitude, userLongitude *float64
		if instance.User != nil {
			userID = instance.User.UserID
			username = instance.User.Username
			userLatitude = instance.User.Latitude
			userLongitude = instance.User.Longitude
			if instance.User.Latitude != nil && instance.User.Longitude != nil {
				// Calculate the distance
				userDistance = haversine(latitude, longitude, *instance.User.Latitude, *instance.User.Longitude)
			} else {
				logrus.Warnf("User %s has missing latitude/longitude data, skipping distance calculation", instance.User.UserID)
			}
		} else {
			logrus.Warnf("Instance %s has no associated user, skipping user and distance information", instance.InstanceID)
		}

		// Build the instance data to return (excluding trace_id)
		instanceData := map[string]interface{}{
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
			"location_caught":  instance.LocationCaught,
			"location_card":    instance.LocationCard,
			"friendship_level": instance.FriendshipLevel,
			"last_update":      instance.LastUpdate,
			"date_caught":      instance.DateCaught,
			"date_added":       instance.DateAdded,
			"wanted_filters":   instance.WantedFilters,
			"trade_filters":    instance.TradeFilters,
			"distance":         userDistance, // Calculated distance from the querying user
		}

		// Add user info if available
		if userID != "" && username != "" {
			instanceData["user_id"] = userID
			instanceData["username"] = username
			if userLatitude != nil && userLongitude != nil {
				instanceData["latitude"] = *userLatitude
				instanceData["longitude"] = *userLongitude
			}
		}

		// Add the instance data to the response, using instance_id as the key
		responseData[instance.InstanceID] = instanceData
	}

	// Log and return the response data
	logrus.Infof("Returning %d Pokemon instances", len(responseData))
	return c.Status(fiber.StatusOK).JSON(responseData)
}
