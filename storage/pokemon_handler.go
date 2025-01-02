// pokemon_handler.go
package main

import (
	"errors"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ---------------------
// POKEMON
// ---------------------

func parseAndUpsertPokemon(data map[string]interface{}, userID string, messageTraceID string) (createdCount, updatedCount, deletedCount int, err error) {
	pokemonUpdates, _ := data["pokemonUpdates"].([]interface{})
	for _, p := range pokemonUpdates {
		pm, ok := p.(map[string]interface{})
		if !ok {
			logrus.Warn("Invalid Pokémon update format; skipping.")
			continue
		}

		instanceID := fmt.Sprintf("%v", pm["key"])
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
		// Remove individual trace_id extraction
		// traceID := parseNullableString(pm["trace_id"])

		// Date
		dateCaught := parseOptionalDate(pm["date_caught"])

		// JSON => "{}" if missing/empty
		notTradeList := safeJSON(pm["not_trade_list"])
		notWantedList := safeJSON(pm["not_wanted_list"])
		tradeFilters := safeJSON(pm["trade_filters"])
		wantedFilters := safeJSON(pm["wanted_filters"])

		// Prepare a map for updates
		updates := map[string]interface{}{
			"pokemon_id":       pokemonID,
			"nickname":         nickname,
			"cp":               cp,
			"attack_iv":        attackIV,
			"defense_iv":       defenseIV,
			"stamina_iv":       staminaIV,
			"shiny":            shiny,
			"costume_id":       costumeID,
			"lucky":            lucky,
			"shadow":           shadow,
			"purified":         purified,
			"fast_move_id":     fastMoveID,
			"charged_move1_id": chargedMove1ID,
			"charged_move2_id": chargedMove2ID,
			"weight":           weight,
			"height":           height,
			"gender":           gender,
			"mirror":           mirror,
			"pref_lucky":       prefLucky,
			"registered":       registered,
			"favorite":         favorite,
			"location_card":    locationCard,
			"location_caught":  locationCaught,
			"friendship_level": friendshipLevel,
			"date_caught":      dateCaught,
			"last_update":      msgLastUpdate,
			"is_unowned":       isUnowned,
			"is_owned":         isOwned,
			"is_for_trade":     isForTrade,
			"is_wanted":        isWanted,
			"not_trade_list":   *notTradeList,
			"not_wanted_list":  *notWantedList,
			"trade_filters":    tradeFilters,
			"wanted_filters":   wantedFilters,
			"trace_id":         messageTraceID, // Use messageTraceID instead of individual traceID
		}

		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			newInstance := PokemonInstance{
				InstanceID:      instanceID,
				UserID:          userID,
				PokemonID:       pokemonID,
				Shiny:           shiny,
				Lucky:           lucky,
				Shadow:          shadow,
				Purified:        purified,
				Mirror:          mirror,
				PrefLucky:       prefLucky,
				Registered:      registered,
				Favorite:        favorite,
				NotTradeList:    *notTradeList,
				NotWantedList:   *notWantedList,
				TradeFilters:    tradeFilters,
				WantedFilters:   wantedFilters,
				LastUpdate:      msgLastUpdate,
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
				TraceID:         &messageTraceID, // Assign messageTraceID
				DateAdded:       time.Now(),
			}

			if errCreate := DB.Create(&newInstance).Error; errCreate != nil {
				logrus.Warnf("Failed to create instance %s for user %s: %v", instanceID, userID, errCreate)
				continue
			}
			createdCount++
		} else if tx.Error == nil {
			// UPDATE using map to include zero values
			if errUpdate := DB.Model(&existingInstance).Updates(updates).Error; errUpdate != nil {
				logrus.Warnf("Failed to update instance %s: %v", instanceID, errUpdate)
				continue
			}
			updatedCount++
		}
	}
	return
}
