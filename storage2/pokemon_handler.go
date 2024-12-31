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
