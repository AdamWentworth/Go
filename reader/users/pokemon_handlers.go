// pokemon_handlers.go

package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

// GetPokemonInstances handles the GET requests to retrieve Pokémon instances, trades, and related instances for a user
func GetPokemonInstances(c *fiber.Ctx) error {
	userID := c.Params("user_id")
	tokenUserID, ok := c.Locals("user_id").(string) // Extract user_id from context
	if !ok || tokenUserID != userID {
		logrus.Error("Authentication failed: User mismatch")
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "User mismatch"})
	}

	// Extract the username from the JWT token (set by the JWT middleware)
	tokenUsername, _ := c.Locals("username").(string)

	deviceID := c.Query("device_id")
	if deviceID == "" {
		logrus.Error("device_id is missing in request")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing device_id"})
	}

	// Log with the username from the token along with the device_id.
	// You can include both the tokenUsername and userID if you wish.
	logrus.Infof("Fetching ownership data for user %s (ID: %s) from device %s", tokenUsername, userID, deviceID)

	var user User
	if err := db.Where("user_id = ?", userID).First(&user).Error; err != nil {
		logrus.Infof("User %s not found, returning 0 Pokemon instances", userID)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{})
	}

	var instances []PokemonInstance
	if err := db.Where("user_id = ?", userID).Find(&instances).Error; err != nil {
		logrus.Error("Error retrieving instances")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve instances"})
	}

	var trades []Trade
	if err := db.Where("user_id_proposed = ? OR user_id_accepting = ?", userID, userID).Find(&trades).Error; err != nil {
		logrus.Error("Error retrieving trades")
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve trades"})
	}

	// Prepare Pokémon instances map keyed by instance_id
	responseInstances := make(map[string]interface{})
	for _, instance := range instances {
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
			"location_card":    instance.LocationCard,
			"date_added":       instance.DateAdded,
			"date_caught":      instance.DateCaught,
			"friendship_level": instance.FriendshipLevel,
			"last_update":      instance.LastUpdate,
			"wanted_filters":   instance.WantedFilters,
			"trade_filters":    instance.TradeFilters,
			"mega":             instance.Mega,
			"mega_form":        instance.MegaForm,
			"is_mega":          instance.IsMega,
			"level":            instance.Level,
			"is_fused":         instance.IsFused,
			"fusion":           instance.Fusion,
			"fusion_form":      instance.FusionForm,
			"fused_with":       instance.FusedWith,
			"disabled":         instance.Disabled,
			"dynamax":          instance.Dynamax,
			"gigantamax":       instance.Gigantamax,
			"max_attack":       instance.MaxAttack,
			"max_guard":        instance.MaxGuard,
			"max_spirit":       instance.MaxSpirit,
		}
		responseInstances[instance.InstanceID] = instanceMap
	}

	// Prepare trades map keyed by trade_id with selected attributes
	responseTrades := make(map[string]interface{})
	for _, trade := range trades {
		tradeMap := map[string]interface{}{
			"is_special_trade":                    trade.IsSpecialTrade,
			"is_registered_trade":                 trade.IsRegisteredTrade,
			"is_lucky_trade":                      trade.IsLuckyTrade,
			"pokemon_instance_id_user_proposed":   trade.PokemonInstanceIDUserProposed,
			"pokemon_instance_id_user_accepting":  trade.PokemonInstanceIDUserAccepting,
			"trade_accepted_date":                 trade.TradeAcceptedDate,
			"trade_cancelled_by":                  trade.TradeCancelledBy,
			"trade_cancelled_date":                trade.TradeCancelledDate,
			"trade_completed_date":                trade.TradeCompletedDate,
			"trade_dust_cost":                     trade.TradeDustCost,
			"trade_friendship_level":              trade.TradeFriendshipLevel,
			"trade_id":                            trade.TradeID,
			"trade_proposal_date":                 trade.TradeProposalDate,
			"trade_status":                        trade.TradeStatus,
			"username_proposed":                   trade.UsernameProposed,
			"username_accepting":                  trade.UsernameAccepting,
			"user_1_trade_satisfaction":           trade.User1TradeSatisfaction,
			"user_2_trade_satisfaction":           trade.User2TradeSatisfaction,
			"user_proposed_completion_confirmed":  trade.UserProposedCompletionConfirmed,
			"user_accepting_completion_confirmed": trade.UserAcceptingCompletionConfirmed,
			"last_update":                         trade.LastUpdate,
		}
		responseTrades[trade.TradeID] = tradeMap
	}

	// Determine related Pokémon instance IDs for each trade
	tradeToRelatedID := make(map[string]string) // maps tradeID -> related instance ID
	var relatedIDs []string                     // list of all related instance IDs to fetch
	for _, trade := range trades {
		if trade.UserIDProposed == userID {
			tradeToRelatedID[trade.TradeID] = trade.PokemonInstanceIDUserAccepting
			relatedIDs = append(relatedIDs, trade.PokemonInstanceIDUserAccepting)
		} else if trade.UserIDAccepting == userID {
			tradeToRelatedID[trade.TradeID] = trade.PokemonInstanceIDUserProposed
			relatedIDs = append(relatedIDs, trade.PokemonInstanceIDUserProposed)
		}
	}

	// Fetch all related instances in bulk
	var relatedInstancesData []PokemonInstance
	if len(relatedIDs) > 0 {
		if err := db.Where("instance_id IN ?", relatedIDs).Find(&relatedInstancesData).Error; err != nil {
			logrus.Error("Error retrieving related instances")
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve related instances"})
		}
	}

	// Map related instance IDs to their attribute maps
	relatedInstanceByID := make(map[string]interface{})
	for _, instance := range relatedInstancesData {
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
			"mega":             instance.Mega,
			"mega_form":        instance.MegaForm,
			"is_mega":          instance.IsMega,
			"level":            instance.Level,
			"is_fused":         instance.IsFused,
			"fusion":           instance.Fusion,
			"fusion_form":      instance.FusionForm,
			"fused_with":       instance.FusedWith,
			"disabled":         instance.Disabled,
			"dynamax":          instance.Dynamax,
			"gigantamax":       instance.Gigantamax,
			"max_attack":       instance.MaxAttack,
			"max_guard":        instance.MaxGuard,
			"max_spirit":       instance.MaxSpirit,
		}
		relatedInstanceByID[instance.InstanceID] = instanceMap
	}

	logrus.Infof("User %s retrieved %d Pokémon instances, %d trades, and %d related instances",
		user.Username, len(responseInstances), len(responseTrades), len(relatedInstanceByID))

	response := fiber.Map{
		"pokemon_instances": responseInstances,
		"trades":            responseTrades,
		"related_instances": relatedInstanceByID, // Keys are instance_id now
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

func GetPokemonInstancesByUsername(c *fiber.Ctx) error {
	// Retrieve the username from the route
	username := c.Params("username")

	// Retrieve the token's username
	tokenUsername, _ := c.Locals("username").(string)
	logrus.Infof("User %s is fetching ownership data for username %s", tokenUsername, username)

	// Fetch user by LOWER(username)
	var user User
	if err := db.Where("LOWER(username) = ?", strings.ToLower(username)).First(&user).Error; err != nil {
		logrus.Errorf("User %s not found: %v", username, err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	// Retrieve instances by user_id (which is a string)
	var instances []PokemonInstance
	if err := db.Where("user_id = ?", user.UserID).Find(&instances).Error; err != nil {
		logrus.Errorf("Error retrieving instances for user_id %s: %v", user.UserID, err)
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"error": "Failed to retrieve instances"})
	}

	// Retrieve pending trades for this user
	var pendingTrades []Trade
	if err := db.Where("trade_status = ? AND (user_id_proposed = ? OR user_id_accepting = ?)",
		"pending", user.UserID, user.UserID).
		Find(&pendingTrades).Error; err != nil {
		logrus.Errorf("Error retrieving pending trades for user_id %s: %v", user.UserID, err)
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"error": "Failed to retrieve pending trades"})
	}

	// Mark pending-trade instance IDs
	pendingTradeInstances := make(map[string]bool)
	for _, trade := range pendingTrades {
		pendingTradeInstances[trade.PokemonInstanceIDUserProposed] = true
		pendingTradeInstances[trade.PokemonInstanceIDUserAccepting] = true
	}

	// Build the response data
	responseData := make(map[string]interface{})

	// We'll track the maximum LastUpdate to build an ETag.
	// Because LastUpdate is *int64, we'll convert it to time.Time if not nil.
	var latestUpdate time.Time

	for _, instance := range instances {
		// Safely convert LastUpdate (*int64) to time.Time (assuming epoch SECONDS)
		var updateTime time.Time
		if instance.LastUpdate != nil {
			// If your LastUpdate is actually epoch *seconds*, do:
			updateTime = time.Unix(*instance.LastUpdate, 0)

			// If your LastUpdate is epoch *milliseconds*, do:
			// updateTime = time.UnixMilli(*instance.LastUpdate)

			// If your LastUpdate is epoch *nanoseconds*, do:
			// updateTime = time.Unix(0, *instance.LastUpdate)

			if updateTime.After(latestUpdate) {
				latestUpdate = updateTime
			}
		}

		// Build the map of fields
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
			// We only set "is_for_trade" to false if this instance is involved in a pending trade
			"is_for_trade":     instance.IsForTrade && !pendingTradeInstances[instance.InstanceID],
			"is_wanted":        instance.IsWanted,
			"not_trade_list":   instance.NotTradeList,
			"not_wanted_list":  instance.NotWantedList,
			"location_caught":  instance.LocationCaught,
			"location_card":    instance.LocationCard,
			"date_added":       instance.DateAdded,
			"date_caught":      instance.DateCaught,
			"friendship_level": instance.FriendshipLevel,
			// We'll store the raw *int64 for last_update, or we can store an ISO time string if you prefer
			"last_update":    instance.LastUpdate,
			"wanted_filters": instance.WantedFilters,
			"trade_filters":  instance.TradeFilters,
			"mega":           instance.Mega,
			"mega_form":      instance.MegaForm,
			"is_mega":        instance.IsMega,
			"level":          instance.Level,
			"is_fused":       instance.IsFused,
			"fusion":         instance.Fusion,
			"fusion_form":    instance.FusionForm,
			"fused_with":     instance.FusedWith,
			"disabled":       instance.Disabled,
			"dynamax":        instance.Dynamax,
			"gigantamax":     instance.Gigantamax,
			"max_attack":     instance.MaxAttack,
			"max_guard":      instance.MaxGuard,
			"max_spirit":     instance.MaxSpirit,
		}

		// Add to the response keyed by instance_id
		responseData[instance.InstanceID] = instanceMap
	}

	instanceCount := len(responseData)

	// Compute ETag from latestUpdate
	var etag string
	if instanceCount > 0 && !latestUpdate.IsZero() {
		// Use the UnixNano of the "latest" record
		etag = fmt.Sprintf("%d", latestUpdate.UnixNano())
	} else {
		// If no instances or no valid LastUpdate, fallback
		etag = "0"
	}

	// Compare with client's If-None-Match
	clientEtag := c.Get("If-None-Match")
	if clientEtag != "" && clientEtag == etag {
		// Data has not changed
		logrus.Infof("Returning 304 Not Modified for user %s", username)
		return c.Status(fiber.StatusNotModified).Send(nil)
	}

	// Otherwise, set ETag and return data
	c.Set("ETag", etag)

	logrus.Infof("User %s retrieved %d Pokemon instances for username %s", tokenUsername, instanceCount, username)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"username":  user.Username,
		"instances": responseData,
	})
}
