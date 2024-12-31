// message_handler.go

package main

import (
	"errors"
	"fmt"
	"github.com/sirupsen/logrus"
	"strconv"

	"gorm.io/gorm"
)

// HandleMessage replicates the big "handle_message" in Django
func HandleMessage(data map[string]interface{}) error {
	// 1) Upsert user
	userID, username, lat, lng := parseUserData(data)

	var existingUser User

	tx := DB.Where("user_id = ?", userID).First(&existingUser)
	if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
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
		if existingUser.Username != username {
			logrus.Infof("Username mismatch for user_id %s. DB user=%s, message user=%s.",
				userID, existingUser.Username, username)
			return nil // skip
		}
		existingUser.Latitude = lat
		existingUser.Longitude = lng
		if err := DB.Save(&existingUser).Error; err != nil {
			return fmt.Errorf("failed to update user location: %w", err)
		}
	}

	// 2) Process Pokemon updates
	parseAndUpsertPokemon(data, userID)

	// 3) Process Trades
	parseAndUpsertTrades(data)

	logrus.Infof("Message for user %s processed successfully.", username)
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

func parseAndUpsertPokemon(data map[string]interface{}, userID string) {
	pokemonUpdates, _ := data["pokemonUpdates"].([]interface{})
	for _, p := range pokemonUpdates {
		pm, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		instanceID := fmt.Sprintf("%v", pm["instance_id"])
		isUnowned, _ := pm["is_unowned"].(bool)
		isOwned, _ := pm["is_owned"].(bool)
		isWanted, _ := pm["is_wanted"].(bool)
		isForTrade, _ := pm["is_for_trade"].(bool)

		// Deletion
		if isUnowned && !isOwned && !isWanted && !isForTrade {
			DB.Delete(&PokemonInstance{}, "instance_id = ?", instanceID)
			continue
		}

		var existingInstance PokemonInstance
		tx := DB.Where("instance_id = ?", instanceID).First(&existingInstance)
		olderOrSame := false
		if tx.Error == nil {
			msgLastUpdate, _ := pm["last_update"].(float64)
			if existingInstance.LastUpdate >= int64(msgLastUpdate) {
				olderOrSame = true
			}
		}

		if !olderOrSame {
			lastUpdate, _ := pm["last_update"].(float64)
			cp := parseOptionalInt(pm["cp"])
			pokemonID := parseOptionalInt(pm["pokemon_id"])

			defaults := PokemonInstance{
				InstanceID: instanceID,
				UserID:     userID,
				PokemonID:  pokemonID,
				CP:         &cp,
				LastUpdate: int64(lastUpdate),
				IsUnowned:  isUnowned,
				IsOwned:    isOwned,
				IsWanted:   isWanted,
				IsForTrade: isForTrade,
			}

			if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
				if err := DB.Create(&defaults).Error; err != nil {
					logrus.Infof("Failed to create instance for user %s: %v", userID, err)
				}
			} else if tx.Error == nil {
				if err := DB.Model(&existingInstance).Updates(&defaults).Error; err != nil {
					logrus.Infof("Failed to update instance %s: %v", instanceID, err)
				}
			}
		}
	}
}

func parseAndUpsertTrades(data map[string]interface{}) {
	tradeUpdates, _ := data["tradeUpdates"].([]interface{})
	for _, t := range tradeUpdates {
		tradeObj, ok := t.(map[string]interface{})
		if !ok {
			logrus.Warn("Skipping invalid trade object.")
			continue
		}

		tradeData, _ := tradeObj["tradeData"].(map[string]interface{})
		tradeID := ""
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

		logrus.Infof("Processing Trade ID %s: %+v", tradeID, tradeObj)

		// Parse and validate trade_friendship_level
		friendshipLevel := safeString(tradeData["trade_friendship_level"], "Good")
		validFriendshipLevels := map[string]bool{"Good": true, "Great": true, "Ultra": true, "Best": true}
		if !validFriendshipLevels[friendshipLevel] {
			logrus.Warnf("Invalid trade_friendship_level for trade %s: %s. Defaulting to 'Good'.", tradeID, friendshipLevel)
			friendshipLevel = "Good"
		}

		// Parse trade_status with default
		tradeStatus := safeString(tradeData["trade_status"], "proposed")

		// Convert and validate numeric fields
		tradeDustCost := parseOptionalInt(tradeData["trade_dust_cost"])
		user1Satisfaction := parseOptionalInt(tradeData["user_1_trade_satisfaction"])
		user2Satisfaction := parseOptionalInt(tradeData["user_2_trade_satisfaction"])

		// Parse boolean fields
		isSpecialTrade := parseOptionalBool(tradeData["is_special_trade"])
		isRegisteredTrade := parseOptionalBool(tradeData["is_registered_trade"])
		isLuckyTrade := parseOptionalBool(tradeData["is_lucky_trade"])

		// Prepare defaults for upsert
		defaultsTrade := Trade{
			TradeID:                        tradeID,
			UserIDProposed:                 safeString(tradeData["username_proposed"], ""),
			UserIDAccepting:                safeString(tradeData["username_accepting"], ""),
			PokemonInstanceIDUserProposed:  safeString(tradeData["pokemon_instance_id_user_proposed"], ""),
			PokemonInstanceIDUserAccepting: safeString(tradeData["pokemon_instance_id_user_accepting"], ""),
			TradeStatus:                    tradeStatus,
			TradeFriendshipLevel:           friendshipLevel,
			TradeDustCost:                  &tradeDustCost,
			IsSpecialTrade:                 isSpecialTrade,
			IsRegisteredTrade:              isRegisteredTrade,
			IsLuckyTrade:                   isLuckyTrade,
			User1TradeSatisfaction:         &user1Satisfaction,
			User2TradeSatisfaction:         &user2Satisfaction,
		}

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
}

// Helper functions for parsing
func parseOptionalInt(value interface{}) int {
	if value == nil {
		return 0
	}
	intValue, err := strconv.Atoi(fmt.Sprintf("%v", value))
	if err != nil {
		return 0
	}
	return intValue
}

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

func safeString(value interface{}, defaultValue string) string {
	if value == nil {
		return defaultValue
	}
	return fmt.Sprintf("%v", value)
}