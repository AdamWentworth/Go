// update_handler.go

package main

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

func getUsernameByUserID(userID string) (string, error) {
	var username string
	// Assuming there is a "users" table with "user_id" and "username" columns
	if err := db.Table("users").Where("user_id = ?", userID).Select("username").Scan(&username).Error; err != nil {
		return "", err
	}
	return username, nil
}

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

	logrus.Infof("Fetching updates for username %s since %d", c.Locals("username"), timestampInt)

	// Retrieve Pokémon instances for the user updated after the timestamp
	var instances []PokemonInstance
	if err := db.Where("user_id = ? AND last_update > ?", userID, timestampInt).Find(&instances).Error; err != nil {
		logrus.Errorf("Error retrieving Pokémon updates: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve updates"})
	}

	// Prepare the Pokémon response data
	pokemonData := make(map[string]interface{})
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
		}
		pokemonData[instance.InstanceID] = instanceMap
	}

	// Query trades updated after the timestamp involving the user
	var tradesList []Trade
	if err := db.Where("((user_id_proposed = ? OR user_id_accepting = ?) AND last_update > ?)", userID, userID, timestampInt).
		Find(&tradesList).Error; err != nil {
		logrus.Errorf("Error retrieving trades: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve trade updates"})
	}

	// Build tradeMap from tradesList using a custom map for each trade
	tradeMap := make(map[string]interface{})
	for _, trade := range tradesList {
		// Construct a custom map for each trade
		tmap := map[string]interface{}{
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
		tradeMap[trade.TradeID] = tmap
	}

	// Fetch related instances for trades not owned by the current user
	relatedInstances := make(map[string]interface{})
	for _, trade := range tradesList {
		// If the proposer is not the current user, fetch their Pokémon instance
		if trade.UserIDProposed != userID && trade.PokemonInstanceIDUserProposed != "" {
			var instance PokemonInstance
			if err := db.Where("instance_id = ?", trade.PokemonInstanceIDUserProposed).First(&instance).Error; err == nil {
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
				}
				relatedInstances[instance.InstanceID] = instanceMap
			}
		}
		// If the accepter is not the current user, fetch their Pokémon instance
		if trade.UserIDAccepting != userID && trade.PokemonInstanceIDUserAccepting != "" {
			var instance PokemonInstance
			if err := db.Where("instance_id = ?", trade.PokemonInstanceIDUserAccepting).First(&instance).Error; err == nil {
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
				}
				relatedInstances[instance.InstanceID] = instanceMap
			}
		}
	}

	// Prepare final response
	response := map[string]interface{}{
		"pokemon":          pokemonData,
		"trade":            tradeMap,
		"relatedInstances": relatedInstances,
	}

	logrus.Infof("User %s retrieved %d Pokémon updates, %d trades, and %d related instances",
		c.Locals("username"), len(pokemonData), len(tradeMap), len(relatedInstances))
	return c.Status(fiber.StatusOK).JSON(response)
}
