// trades_handler.go
package main

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ---------------------
// TRADES
// ---------------------

func parseAndUpsertTrades(data map[string]interface{}) (createdTrades, updatedTrades, droppedTrades int, err error) {
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

		rawLastUpdate := fmt.Sprintf("%v", tradeData["last_update"])
		var lastUpdate *int64 = nil
		if rawLastUpdate != "" && rawLastUpdate != "<nil>" {
			if f, err := strconv.ParseFloat(rawLastUpdate, 64); err == nil {
				lu := int64(f)
				lastUpdate = &lu
			} else {
				logrus.Warnf("Could not parse last_update for trade %s: %v", tradeID, err)
			}
		}

		// Build the Trade object
		updates := Trade{
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

			TraceID:    traceID, // nil if not provided
			LastUpdate: lastUpdate,
		}

		// Check for existing trade
		var existingTrade Trade
		tx := DB.Where("trade_id = ?", tradeID).First(&existingTrade)

		// If trade not found
		if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
			// Skip creating a new trade if its status is "deleted"
			if tradeStatus == "deleted" {
				// Nothing to do since we don't create trades flagged as deleted
				continue
			}
			// Otherwise, insert new trade
			if err := DB.Create(&updates).Error; err != nil {
				logrus.Errorf("Failed to create Trade %s: %v", tradeID, err)
			} else {
				createdTrades++
			}
		} else if tx.Error == nil {
			// If an existing trade is found and the incoming status is "deleted"
			if tradeStatus == "deleted" {
				// Delete the trade instead of updating it
				if err := DB.Delete(&Trade{}, "trade_id = ?", tradeID).Error; err != nil {
					logrus.Errorf("Failed to delete Trade %s: %v", tradeID, err)
				} else {
					droppedTrades++
				}
				// Skip further update processing for this trade
				continue
			}

			// For non-deleted trades, update only if the incoming update is newer
			if existingTrade.LastUpdate != nil && updates.LastUpdate != nil &&
				*existingTrade.LastUpdate >= *updates.LastUpdate {
				logrus.Infof("Skipping update for Trade %s: incoming last_update (%d) is not newer than existing (%d)",
					tradeID, *updates.LastUpdate, *existingTrade.LastUpdate)
			} else {
				if err := DB.Model(&existingTrade).Updates(&updates).Error; err != nil {
					logrus.Errorf("Failed to update Trade %s: %v", tradeID, err)
				} else {
					updatedTrades++
				}
			}
		} else {
			logrus.Errorf("Failed to retrieve Trade %s: %v", tradeID, tx.Error)
		}
	}
	return
}
