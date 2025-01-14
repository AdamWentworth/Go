// trades_handler.go

package main

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ---------------------
// TRADES
// ---------------------

// validTransitions defines allowed next statuses from a given current status.
var validTransitions = map[string][]string{
	"proposed":  {"deleted", "denied", "pending"},
	"pending":   {"cancelled", "completed"},
	"cancelled": {"proposed"},
	"denied":    {}, // once denied, no further updates allowed
	"completed": {}, // once completed, no further updates allowed
}

// isValidTransition checks if we can go from oldStatus to newStatus.
func isValidTransition(oldStatus, newStatus string) bool {
	if oldStatus == newStatus {
		// If it's exactly the same status, we can treat it as valid or decide to skip.
		return true
	}

	possibleNext, ok := validTransitions[oldStatus]
	if !ok {
		return false
	}
	for _, s := range possibleNext {
		if s == newStatus {
			return true
		}
	}
	return false
}

// parseAndUpsertTrades processes incoming trade updates in a transactional manner
// and enforces valid status transitions, chronological updates, etc.
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
		var lastUpdate *int64
		if rawLastUpdate != "" && rawLastUpdate != "<nil>" {
			if f, errFloat := strconv.ParseFloat(rawLastUpdate, 64); errFloat == nil {
				lu := int64(f)
				lastUpdate = &lu
			} else {
				logrus.Warnf("Could not parse last_update for trade %s: %v", tradeID, errFloat)
			}
		}

		// Build the incoming "updates" object
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
			TradeAcceptedDate:  tradeAcceptedDate,
			TradeCompletedDate: tradeCompletedDate,
			TradeCancelledDate: tradeCancelledDate,
			TradeCancelledBy:   tradeCancelledBy,

			IsSpecialTrade:         isSpecialTrade,
			IsRegisteredTrade:      isRegisteredTrade,
			IsLuckyTrade:           isLuckyTrade,
			TradeDustCost:          tradeDustCost,
			TradeFriendshipLevel:   friendshipLevel,
			User1TradeSatisfaction: user1TradeSatisfaction,
			User2TradeSatisfaction: user2TradeSatisfaction,

			TraceID:    traceID,
			LastUpdate: lastUpdate,
		}

		// Use a transaction so we can lock the row to avoid race conditions.
		txErr := DB.Transaction(func(tx *gorm.DB) error {
			var existingTrade Trade
			// Attempt to SELECT the existing trade with a row-level lock
			findErr := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("trade_id = ?", tradeID).First(&existingTrade).Error

			if errors.Is(findErr, gorm.ErrRecordNotFound) {
				// If trade not found: only create if not "deleted".
				if tradeStatus == "deleted" {
					// Nothing to do, skip creation
					return nil
				}
				// Otherwise, insert new trade
				if createErr := tx.Create(&updates).Error; createErr != nil {
					logrus.Errorf("Failed to create Trade %s: %v", tradeID, createErr)
					return createErr
				}
				createdTrades++
				return nil
			}
			if findErr != nil {
				// Some other DB error
				logrus.Errorf("Failed to retrieve Trade %s: %v", tradeID, findErr)
				return findErr
			}

			// We have an existing trade record here.
			// If incoming is "deleted", physically remove the row.
			if tradeStatus == "deleted" {
				if delErr := tx.Delete(&Trade{}, "trade_id = ?", tradeID).Error; delErr != nil {
					logrus.Errorf("Failed to delete Trade %s: %v", tradeID, delErr)
					return delErr
				}
				droppedTrades++
				return nil // no further updates
			}

			// Check chronological order via last_update
			if existingTrade.LastUpdate != nil && updates.LastUpdate != nil {
				if *existingTrade.LastUpdate >= *updates.LastUpdate {
					// If the existing is equal or newer, skip
					logrus.Infof(
						"Skipping update for Trade %s: incoming last_update (%d) is not newer than existing (%d)",
						tradeID, *updates.LastUpdate, *existingTrade.LastUpdate,
					)
					return nil
				}
			}

			// Check valid status transition
			// (only if the status actually changed)
			if !isValidTransition(existingTrade.TradeStatus, updates.TradeStatus) {
				logrus.Warnf(
					"Invalid status transition: %s -> %s for trade %s",
					existingTrade.TradeStatus,
					updates.TradeStatus,
					tradeID,
				)
				return nil // or return an error if you prefer
			}

			// If everything is good, do the update
			if errUpdate := tx.Model(&existingTrade).
				Select("*"). // Force update on all fields, including nil values
				Updates(&updates).Error; errUpdate != nil {
				logrus.Errorf("Failed to update Trade %s: %v", tradeID, errUpdate)
				return errUpdate
			}
			updatedTrades++
			return nil
		})

		if txErr != nil {
			// If the transaction itself failed, we can bubble that up or keep going
			logrus.Errorf("Transaction error for Trade %s: %v", tradeID, txErr)
			// Decide if we keep going or set err = txErr
			// For now, just set err = txErr to note the first error
			if err == nil {
				err = txErr
			}
		}
	}
	return
}
