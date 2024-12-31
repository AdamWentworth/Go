// message_handler.go

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ---------------------
// HELPER FUNCTIONS
// ---------------------

// parseNullableString returns *string if the incoming value is non-empty; otherwise nil.
// This matches your request to “convert empty strings to null” for nullable columns.
func parseNullableString(value interface{}) *string {
	if value == nil {
		return nil
	}
	strVal := fmt.Sprintf("%v", value)
	if strVal == "" {
		return nil
	}
	return &strVal
}

// parseOptionalBool tries to convert a value to bool, defaults to false if nil/invalid.
func parseOptionalBool(value interface{}) bool {
	if value == nil {
		return false
	}
	boolValue, err := strconv.ParseBool(fmt.Sprintf("%v", value))
	if err != nil {
		return false
	}
	return boolValue
}

// parseNullableInt returns *int if the value is non-empty and valid; otherwise nil.
func parseNullableInt(value interface{}) *int {
	if value == nil {
		return nil
	}
	strVal := fmt.Sprintf("%v", value)
	if strVal == "" {
		return nil
	}
	intValue, err := strconv.Atoi(strVal)
	if err != nil {
		return nil
	}
	return &intValue
}

// parseRequiredInt ensures that the field is present and non-empty, else returns an error.
func parseRequiredInt(value interface{}) (int, error) {
	if value == nil {
		return 0, errors.New("required int field is missing")
	}
	strVal := fmt.Sprintf("%v", value)
	if strVal == "" {
		return 0, errors.New("required int field is empty")
	}
	intValue, err := strconv.Atoi(strVal)
	if err != nil {
		return 0, fmt.Errorf("invalid int value: %v", err)
	}
	return intValue, nil
}

// parseNullableFloat returns *float64 if non-empty and valid; otherwise nil.
func parseNullableFloat(value interface{}) *float64 {
	if value == nil {
		return nil
	}
	strVal := fmt.Sprintf("%v", value)
	if strVal == "" {
		return nil
	}
	floatValue, err := strconv.ParseFloat(strVal, 64)
	if err != nil {
		return nil
	}
	return &floatValue
}

// parseOptionalDate tries to parse a date/datetime string into time.Time. If unrecognized, returns nil.
func parseOptionalDate(value interface{}) *time.Time {
	if value == nil {
		return nil
	}
	strVal := strings.TrimSpace(fmt.Sprintf("%v", value))
	if strVal == "" {
		return nil
	}
	layouts := []string{
		"2006-01-02",
		"2006-01-02T15:04:05Z",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, strVal); err == nil {
			return &t
		}
	}
	logrus.Errorf("Unrecognized date format for date_caught/date_added: %s", strVal)
	return nil
}

// parseOptionalTime parses timestamps for Trades (proposal/accepted/etc). Returns nil if parse fails.
func parseOptionalTime(value interface{}) *time.Time {
	if value == nil {
		return nil // Return nil if the value is nil
	}
	strVal := strings.TrimSpace(fmt.Sprintf("%v", value))
	if strVal == "" {
		return nil // Return nil if the value is empty
	}
	t, err := time.Parse(time.RFC3339, strVal)
	if err != nil {
		return nil // Silently return nil if parsing fails
	}
	return &t
}

// safeFloat parses a float with fallback if invalid.
func safeFloat(value interface{}, fallback float64) float64 {
	if value == nil {
		return fallback
	}
	f, err := strconv.ParseFloat(fmt.Sprintf("%v", value), 64)
	if err != nil {
		return fallback
	}
	return f
}

// safeJSON replicates Python’s “jsonField or {}” => always store at least "{}".
func safeJSON(value interface{}) *string {
	if value == nil {
		empty := "{}"
		return &empty
	}
	bytes, err := json.Marshal(value)
	if err != nil {
		empty := "{}"
		return &empty
	}
	str := string(bytes)
	// If user passes an empty string for a JSON field, we store "{}"
	if str == `""` {
		str = "{}"
	}
	return &str
}

// ---------------------
// MAIN HANDLER
// ---------------------

func HandleMessage(data map[string]interface{}) error {
	// 1) Upsert / verify user
	userID, username, lat, lng := parseUserData(data)
	var existingUser User
	tx := DB.Where("user_id = ?", userID).First(&existingUser)
	if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		// Create user
		newUser := User{
			UserID:    userID,
			Username:  username,
			Latitude:  lat,
			Longitude: lng,
		}
		if err := DB.Create(&newUser).Error; err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}
	} else if tx.Error != nil {
		return fmt.Errorf("error checking user: %w", tx.Error)
	} else {
		// If mismatch, skip
		if existingUser.Username != username {
			logrus.Infof("Username mismatch: user_id=%s, DB username=%s, message username=%s. Skipping.",
				userID, existingUser.Username, username)
			return nil
		}
		// Update location
		existingUser.Latitude = lat
		existingUser.Longitude = lng
		if err := DB.Save(&existingUser).Error; err != nil {
			return fmt.Errorf("failed to update user location: %w", err)
		}
	}

	// 2) Process Pokemon updates
	createdCount, updatedCount, deletedCount, err := parseAndUpsertPokemon(data, userID)
	if err != nil {
		logrus.Errorf("Failed parsing/upserting Pokémon for user %s: %v", userID, err)
	}

	// 3) Process Trades
	if err := parseAndUpsertTrades(data); err != nil {
		logrus.Errorf("Failed parsing/upserting Trades: %v", err)
	}

	// 4) Log summary
	actions := []string{}
	if createdCount > 0 {
		actions = append(actions, fmt.Sprintf("created %d", createdCount))
	}
	if updatedCount > 0 {
		actions = append(actions, fmt.Sprintf("updated %d", updatedCount))
	}
	if deletedCount > 0 {
		actions = append(actions, fmt.Sprintf("dropped %d", deletedCount))
	}
	summary := "no changes"
	if len(actions) > 0 {
		summary = strings.Join(actions, ", ")
	}
	logrus.Infof("User %s %s instances with status 200", username, summary)
	return nil
}

func parseUserData(data map[string]interface{}) (userID, username string, lat, lng float64) {
	userID = fmt.Sprintf("%v", data["user_id"])
	username = fmt.Sprintf("%v", data["username"])
	location, _ := data["location"].(map[string]interface{})
	if location != nil {
		lat, _ = location["latitude"].(float64)
		lng, _ = location["longitude"].(float64)
	}
	return
}

// ---------------------
// TRADES
// ---------------------

func parseAndUpsertTrades(data map[string]interface{}) error {
	tradeUpdates, _ := data["tradeUpdates"].([]interface{})

	// Parse nullable TraceID
	traceID := parseNullableString(data["trace_id"])

	for _, t := range tradeUpdates {
		tradeObj, ok := t.(map[string]interface{})
		if !ok {
			logrus.Warn("Skipping invalid trade object.")
			continue
		}
		tradeData, _ := tradeObj["tradeData"].(map[string]interface{})

		// Get trade_id or fallback to "key"
		var tradeID string
		if tradeData != nil {
			tradeID = fmt.Sprintf("%v", tradeData["trade_id"])
		}
		if tradeID == "" {
			tradeID = fmt.Sprintf("%v", tradeObj["key"])
		}
		if tradeID == "" {
			logrus.Warn("Skipping a Trade update because no trade_id found.")
			continue
		}

		// Proposed / accepting usernames => user IDs
		proposedUsername := fmt.Sprintf("%v", tradeData["username_proposed"])
		acceptingUsername := fmt.Sprintf("%v", tradeData["username_accepting"])
		proposedUserID := getUserIdForUsername(proposedUsername)
		acceptingUserID := getUserIdForUsername(acceptingUsername)

		// Time fields
		tradeProposalDate := parseOptionalTime(fmt.Sprintf("%v", tradeData["trade_proposal_date"]))
		tradeAcceptedDate := parseOptionalTime(fmt.Sprintf("%v", tradeData["trade_accepted_date"]))
		tradeCompletedDate := parseOptionalTime(fmt.Sprintf("%v", tradeData["trade_completed_date"]))
		tradeCancelledDate := parseOptionalTime(fmt.Sprintf("%v", tradeData["trade_cancelled_date"]))

		// Nullable fields for cancelled details
		tradeCancelledBy := parseNullableString(tradeData["trade_cancelled_by"])

		// Boolean and integer fields
		isSpecialTrade := parseOptionalBool(tradeData["is_special_trade"])
		isRegisteredTrade := parseOptionalBool(tradeData["is_registered_trade"])
		isLuckyTrade := parseOptionalBool(tradeData["is_lucky_trade"])
		tradeDustCost := parseNullableInt(tradeData["trade_dust_cost"])

		// Default trade status
		tradeStatus := fmt.Sprintf("%v", tradeData["trade_status"])
		if tradeStatus == "" {
			tradeStatus = "proposed"
		}

		// Validate friendship level
		friendshipLevel := fmt.Sprintf("%v", tradeData["trade_friendship_level"])
		if friendshipLevel == "" {
			friendshipLevel = "Good"
		}
		validLevels := []string{"Good", "Great", "Ultra", "Best"}
		isValidLevel := false
		for _, lvl := range validLevels {
			if friendshipLevel == lvl {
				isValidLevel = true
				break
			}
		}
		if !isValidLevel {
			logrus.Warnf("Invalid friendship level for trade %s: %s. Defaulting to 'Good'.", tradeID, friendshipLevel)
			friendshipLevel = "Good"
		}

		// Satisfaction ratings
		user1TradeSatisfaction := parseNullableInt(tradeData["user_1_trade_satisfaction"])
		user2TradeSatisfaction := parseNullableInt(tradeData["user_2_trade_satisfaction"])

		// Additional fields
		pokemonInstanceIDUserProposed := fmt.Sprintf("%v", tradeData["pokemon_instance_id_user_proposed"])
		pokemonInstanceIDUserAccepting := fmt.Sprintf("%v", tradeData["pokemon_instance_id_user_accepting"])

		// Build the Trade object
		defaultsTrade := Trade{
			TradeID:                        tradeID,
			UserIDProposed:                 proposedUserID,
			UsernameProposed:               proposedUsername,
			UserIDAccepting:                acceptingUserID,
			UsernameAccepting:              acceptingUsername,
			PokemonInstanceIDUserProposed:  pokemonInstanceIDUserProposed,
			PokemonInstanceIDUserAccepting: pokemonInstanceIDUserAccepting,

			TradeStatus:        tradeStatus,
			TradeProposalDate:  tradeProposalDate,
			TradeAcceptedDate:  tradeAcceptedDate,  // nil if not provided
			TradeCompletedDate: tradeCompletedDate, // nil if not provided
			TradeCancelledDate: tradeCancelledDate, // nil if not provided
			TradeCancelledBy:   tradeCancelledBy,   // nil if not provided

			IsSpecialTrade:         isSpecialTrade,
			IsRegisteredTrade:      isRegisteredTrade,
			IsLuckyTrade:           isLuckyTrade,
			TradeDustCost:          tradeDustCost,
			TradeFriendshipLevel:   friendshipLevel,
			User1TradeSatisfaction: user1TradeSatisfaction,
			User2TradeSatisfaction: user2TradeSatisfaction,

			TraceID: traceID, // nil if not provided
		}

		// Check for existing trade
		var existingTrade Trade
		tx := DB.Where("trade_id = ?", tradeID).First(&existingTrade)
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			// Insert new trade
			if err := DB.Create(&defaultsTrade).Error; err != nil {
				logrus.Errorf("Failed to create Trade %s: %v", tradeID, err)
			} else {
				logrus.Infof("Trade %s created successfully.", tradeID)
			}
		} else if tx.Error == nil {
			// Update existing trade
			if err := DB.Model(&existingTrade).Updates(&defaultsTrade).Error; err != nil {
				logrus.Errorf("Failed to update Trade %s: %v", tradeID, err)
			} else {
				logrus.Infof("Trade %s updated successfully.", tradeID)
			}
		} else {
			logrus.Errorf("Failed to retrieve Trade %s: %v", tradeID, tx.Error)
		}
	}
	return nil
}

// ---------------------
// POKEMON
// ---------------------

func parseAndUpsertPokemon(data map[string]interface{}, userID string) (createdCount, updatedCount, deletedCount int, err error) {
	pokemonUpdates, _ := data["pokemonUpdates"].([]interface{})
	for _, p := range pokemonUpdates {
		pm, ok := p.(map[string]interface{})
		if !ok {
			logrus.Warn("Invalid Pokémon update format; skipping.")
			continue
		}

		instanceID := fmt.Sprintf("%v", pm["instance_id"])
		if instanceID == "" {
			logrus.Warn("Received Pokémon update with empty instance_id; skipping.")
			continue
		}

		// Deletion logic
		isUnowned := parseOptionalBool(pm["is_unowned"])
		isOwned := parseOptionalBool(pm["is_owned"])
		isWanted := parseOptionalBool(pm["is_wanted"])
		isForTrade := parseOptionalBool(pm["is_for_trade"])
		if isUnowned && !isOwned && !isWanted && !isForTrade {
			if errDel := DB.Delete(&PokemonInstance{}, "instance_id = ?", instanceID).Error; errDel != nil {
				logrus.Warnf("Failed to delete instance_id %s: %v", instanceID, errDel)
			} else {
				deletedCount++
			}
			continue
		}

		var existingInstance PokemonInstance
		tx := DB.Where("instance_id = ?", instanceID).First(&existingInstance)

		// Compare last_update
		msgLastUpdate := int64(safeFloat(pm["last_update"], 0))
		if tx.Error == nil {
			if existingInstance.UserID != userID {
				logrus.Warnf("Unauthorized attempt by user %s to modify instance %s owned by %s",
					userID, instanceID, existingInstance.UserID)
				continue
			}
			if existingInstance.LastUpdate >= msgLastUpdate {
				logrus.Infof("Ignored older or same update for instance %s", instanceID)
				continue
			}
		} else if !errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			logrus.Errorf("Error finding instance %s: %v", instanceID, tx.Error)
			continue
		}

		// Parse required int
		pokemonID, errReq := parseRequiredInt(pm["pokemon_id"])
		if errReq != nil {
			logrus.Warnf("Invalid or missing pokemon_id for instance %s: %v", instanceID, errReq)
			continue
		}

		// Booleans
		shiny := parseOptionalBool(pm["shiny"])
		lucky := parseOptionalBool(pm["lucky"])
		shadow := parseOptionalBool(pm["shadow"])
		purified := parseOptionalBool(pm["purified"])
		mirror := parseOptionalBool(pm["mirror"])
		prefLucky := parseOptionalBool(pm["pref_lucky"])
		registered := parseOptionalBool(pm["registered"])
		favorite := parseOptionalBool(pm["favorite"])

		// Nullable ints/floats
		cp := parseNullableInt(pm["cp"])
		attackIV := parseNullableInt(pm["attack_iv"])
		defenseIV := parseNullableInt(pm["defense_iv"])
		staminaIV := parseNullableInt(pm["stamina_iv"])
		costumeID := parseNullableInt(pm["costume_id"])
		fastMoveID := parseNullableInt(pm["fast_move_id"])
		chargedMove1ID := parseNullableInt(pm["charged_move1_id"])
		chargedMove2ID := parseNullableInt(pm["charged_move2_id"])
		weight := parseNullableFloat(pm["weight"])
		height := parseNullableFloat(pm["height"])
		friendshipLevel := parseNullableInt(pm["friendship_level"])

		// Nullable strings (empty => nil)
		nickname := parseNullableString(pm["nickname"])
		gender := parseNullableString(pm["gender"])
		locationCard := parseNullableString(pm["location_card"])
		locationCaught := parseNullableString(pm["location_caught"])
		traceID := parseNullableString(pm["trace_id"])

		// Date
		dateCaught := parseOptionalDate(pm["date_caught"])

		// JSON => "{}" if missing/empty
		notTradeList := safeJSON(pm["not_trade_list"])
		notWantedList := safeJSON(pm["not_wanted_list"])
		tradeFilters := safeJSON(pm["trade_filters"])
		wantedFilters := safeJSON(pm["wanted_filters"])

		updates := PokemonInstance{
			PokemonID:       pokemonID,
			Nickname:        nickname,
			CP:              cp,
			AttackIV:        attackIV,
			DefenseIV:       defenseIV,
			StaminaIV:       staminaIV,
			Shiny:           shiny,
			CostumeID:       costumeID,
			Lucky:           lucky,
			Shadow:          shadow,
			Purified:        purified,
			FastMoveID:      fastMoveID,
			ChargedMove1ID:  chargedMove1ID,
			ChargedMove2ID:  chargedMove2ID,
			Weight:          weight,
			Height:          height,
			Gender:          gender,
			Mirror:          mirror,
			PrefLucky:       prefLucky,
			Registered:      registered,
			Favorite:        favorite,
			LocationCard:    locationCard,
			LocationCaught:  locationCaught,
			FriendshipLevel: friendshipLevel,
			DateCaught:      dateCaught,
			LastUpdate:      msgLastUpdate,
			IsUnowned:       isUnowned,
			IsOwned:         isOwned,
			IsForTrade:      isForTrade,
			IsWanted:        isWanted,
			NotTradeList:    *notTradeList,
			NotWantedList:   *notWantedList,
			TradeFilters:    tradeFilters,
			WantedFilters:   wantedFilters,
			TraceID:         traceID,
		}

		// CREATE if not found
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			newInstance := PokemonInstance{
				InstanceID:    instanceID,
				UserID:        userID,
				PokemonID:     pokemonID,
				Shiny:         shiny,
				Lucky:         lucky,
				Shadow:        shadow,
				Purified:      purified,
				Mirror:        mirror,
				PrefLucky:     prefLucky,
				Registered:    registered,
				Favorite:      favorite,
				NotTradeList:  *notTradeList,
				NotWantedList: *notWantedList,
				TradeFilters:  tradeFilters,
				WantedFilters: wantedFilters,
				LastUpdate:    msgLastUpdate,

				Nickname:        nickname,
				CP:              cp,
				AttackIV:        attackIV,
				DefenseIV:       defenseIV,
				StaminaIV:       staminaIV,
				CostumeID:       costumeID,
				FastMoveID:      fastMoveID,
				ChargedMove1ID:  chargedMove1ID,
				ChargedMove2ID:  chargedMove2ID,
				Weight:          weight,
				Height:          height,
				Gender:          gender,
				LocationCard:    locationCard,
				LocationCaught:  locationCaught,
				FriendshipLevel: friendshipLevel,
				DateCaught:      dateCaught,
				TraceID:         traceID,

				DateAdded: time.Now(),
			}

			if errCreate := DB.Create(&newInstance).Error; errCreate != nil {
				logrus.Warnf("Failed to create instance %s for user %s: %v", instanceID, userID, errCreate)
				continue
			}
			createdCount++
		} else if tx.Error == nil {
			// UPDATE
			if errUpdate := DB.Model(&existingInstance).Updates(updates).Error; errUpdate != nil {
				logrus.Warnf("Failed to update instance %s: %v", instanceID, errUpdate)
				continue
			}
			updatedCount++
		}
	}
	return
}

// getUserIdForUsername returns empty if not found
func getUserIdForUsername(username string) string {
	if strings.TrimSpace(username) == "" {
		return ""
	}
	var user User
	if err := DB.Where("username = ?", username).First(&user).Error; err != nil {
		logrus.Warnf("No user found for username='%s', storing empty user_id.", username)
		return ""
	}
	return user.UserID
}
