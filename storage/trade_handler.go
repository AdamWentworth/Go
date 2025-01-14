// trades_handler.go

package main

import (
	"errors"
	"fmt"
	"strconv"
	"time"

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
		// If it's exactly the same status, treat as valid or skip.
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
			logrus.Warnf("Invalid friendship level for trade %s: %s. Defaulting to 'Good'.",
				tradeID, friendshipLevel)
			friendshipLevel = "Good"
		}

		// Satisfaction ratings
		user1TradeSatisfaction := parseOptionalBool(tradeData["user_1_trade_satisfaction"])
		user2TradeSatisfaction := parseOptionalBool(tradeData["user_2_trade_satisfaction"])

		// Additional fields
		pokemonInstanceIDUserProposed := fmt.Sprintf("%v", tradeData["pokemon_instance_id_user_proposed"])
		pokemonInstanceIDUserAccepting := fmt.Sprintf("%v", tradeData["pokemon_instance_id_user_accepting"])

		// Parse last_update into an int64
		rawLastUpdate := fmt.Sprintf("%v", tradeData["last_update"])
		var parsedLastUpdate int64
		if rawLastUpdate != "" && rawLastUpdate != "<nil>" {
			if f, errFloat := strconv.ParseFloat(rawLastUpdate, 64); errFloat == nil {
				parsedLastUpdate = int64(f)
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
			LastUpdate: parsedLastUpdate,
		}

		// Debug log before transaction
		logrus.Infof("[DEBUG] Upserting TradeID=%s | IncomingStatus=%s | IncomingLastUpdate=%d",
			tradeID, updates.TradeStatus, updates.LastUpdate)

		// Use a transaction so we can lock the row to avoid race conditions.
		txErr := DB.Transaction(func(tx *gorm.DB) error {
			var existingTrade Trade
			// Attempt to SELECT the existing trade with a row-level lock
			findErr := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("trade_id = ?", tradeID).First(&existingTrade).Error

			if errors.Is(findErr, gorm.ErrRecordNotFound) {
				// If trade not found: only create if not "deleted".
				if tradeStatus == "deleted" {
					logrus.Infof("[DEBUG] Trade %s incoming status is 'deleted'; skipping creation.", tradeID)
					return nil
				}
				// Otherwise, insert new trade
				if createErr := tx.Create(&updates).Error; createErr != nil {
					logrus.Errorf("Failed to create Trade %s: %v", tradeID, createErr)
					return createErr
				}
				createdTrades++
				logrus.Infof("[DEBUG] Created new Trade record %s with status=%s", tradeID, updates.TradeStatus)
				return nil
			}
			if findErr != nil {
				// Some other DB error
				logrus.Errorf("Failed to retrieve Trade %s: %v", tradeID, findErr)
				return findErr
			}

			logrus.Infof("[DEBUG] Found existing Trade %s | existingStatus=%s | existingLastUpdate=%d",
				existingTrade.TradeID, existingTrade.TradeStatus, existingTrade.LastUpdate)

			// If incoming is "deleted", physically remove the row.
			if tradeStatus == "deleted" {
				logrus.Infof("[DEBUG] Deleting Trade %s because incoming status is 'deleted'.", tradeID)
				if delErr := tx.Delete(&Trade{}, "trade_id = ?", tradeID).Error; delErr != nil {
					logrus.Errorf("Failed to delete Trade %s: %v", tradeID, delErr)
					return delErr
				}
				droppedTrades++
				return nil
			}

			// Check chronological order
			if existingTrade.LastUpdate >= updates.LastUpdate {
				logrus.Infof("Skipping update for Trade %s: incoming last_update (%d) <= existing (%d)",
					tradeID, updates.LastUpdate, existingTrade.LastUpdate)
				return nil
			}

			// Check valid status transition
			logrus.Infof("[DEBUG] Checking transition: %s -> %s", existingTrade.TradeStatus, updates.TradeStatus)
			if !isValidTransition(existingTrade.TradeStatus, updates.TradeStatus) {
				logrus.Warnf("Invalid status transition: %s -> %s for trade %s",
					existingTrade.TradeStatus, updates.TradeStatus, tradeID)
				return nil
			}

			// *** STORE OLD STATUS BEFORE UPDATING ***
			oldStatus := existingTrade.TradeStatus

			// Perform the Trade record update
			logrus.Infof("[DEBUG] Updating Trade %s to status=%s last_update=%d ...",
				tradeID, updates.TradeStatus, updates.LastUpdate)
			if errUpdate := tx.Model(&existingTrade).
				Select("*").
				Updates(&updates).Error; errUpdate != nil {
				logrus.Errorf("Failed to update Trade %s: %v", tradeID, errUpdate)
				return errUpdate
			}

			// Optionally reload or trust existingTrade is updated in memory:
			// (We'll trust GORM merges updates into existingTrade.)

			// Now existingTrade.TradeStatus = "completed" in memory, but oldStatus might be "pending"

			logrus.Infof("[DEBUG] After update: oldStatus=%s newStatus=%s (existingTrade.TradeStatus=%s)",
				oldStatus, updates.TradeStatus, existingTrade.TradeStatus)

			// ---------------------------------------------------------
			// Now handle the "pending" → "completed" swap logic
			// ---------------------------------------------------------
			if oldStatus == "pending" && updates.TradeStatus == "completed" {
				// i.e., we changed from "pending" -> "completed"
				logrus.Infof("Detected trade %s going from 'pending' to 'completed'. Swapping Pokémon instances...", tradeID)

				// 1) Get the two instance IDs from the updated trade data
				proposedInstanceID := updates.PokemonInstanceIDUserProposed
				acceptingInstanceID := updates.PokemonInstanceIDUserAccepting

				if proposedInstanceID == "" || acceptingInstanceID == "" {
					logrus.Warnf("Cannot swap instances for Trade %s because instance IDs are missing.", tradeID)
					return nil
				}

				// 2) Fetch the two instances from DB, using "instance_id" as the column
				var proposedInstance, acceptingInstance PokemonInstance
				if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
					Where("instance_id = ?", proposedInstanceID).
					First(&proposedInstance).Error; err != nil {
					logrus.Errorf("Failed to load Proposed instance %s: %v", proposedInstanceID, err)
					return err
				}

				if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
					Where("instance_id = ?", acceptingInstanceID).
					First(&acceptingInstance).Error; err != nil {
					logrus.Errorf("Failed to load Accepting instance %s: %v", acceptingInstanceID, err)
					return err
				}

				// 3) Swap user IDs
				logrus.Infof("[DEBUG] Swapping ownership: proposedInstanceID=%s => userID=%s, acceptingInstanceID=%s => userID=%s",
					proposedInstanceID, acceptingInstance.UserID, acceptingInstanceID, proposedInstance.UserID)

				oldProposedUserID := proposedInstance.UserID
				oldAcceptingUserID := acceptingInstance.UserID
				proposedInstance.UserID = oldAcceptingUserID
				acceptingInstance.UserID = oldProposedUserID

				// 4) Update the ownership flags
				proposedInstance.IsOwned = true
				proposedInstance.IsUnowned = false
				proposedInstance.IsForTrade = false
				proposedInstance.IsWanted = false

				acceptingInstance.IsOwned = true
				acceptingInstance.IsUnowned = false
				acceptingInstance.IsForTrade = false
				acceptingInstance.IsWanted = false

				// 5) Update last_update for both instances
				nowTs := time.Now().Unix()
				proposedInstance.LastUpdate = nowTs
				acceptingInstance.LastUpdate = nowTs

				// 6) Save changes
				if err := tx.Model(&PokemonInstance{}).
					Where("instance_id = ?", proposedInstanceID).
					Updates(map[string]interface{}{
						"user_id":      proposedInstance.UserID,
						"is_owned":     proposedInstance.IsOwned,
						"is_unowned":   proposedInstance.IsUnowned,
						"is_for_trade": proposedInstance.IsForTrade,
						"is_wanted":    proposedInstance.IsWanted,
						"last_update":  nowTs,
					}).Error; err != nil {
					logrus.Errorf("Failed to update proposedInstance %s after trade completion: %v", proposedInstanceID, err)
					return err
				}

				if err := tx.Model(&PokemonInstance{}).
					Where("instance_id = ?", acceptingInstanceID).
					Updates(map[string]interface{}{
						"user_id":      acceptingInstance.UserID,
						"is_owned":     acceptingInstance.IsOwned,
						"is_unowned":   acceptingInstance.IsUnowned,
						"is_for_trade": acceptingInstance.IsForTrade,
						"is_wanted":    acceptingInstance.IsWanted,
						"last_update":  nowTs,
					}).Error; err != nil {
					logrus.Errorf("Failed to update acceptingInstance %s after trade completion: %v", acceptingInstanceID, err)
					return err
				}

				logrus.Infof("Successfully swapped instances for trade %s (pending → completed).", tradeID)
			} else {
				logrus.Infof("[DEBUG] Not swapping. oldStatus=%s, newStatus=%s", oldStatus, updates.TradeStatus)
			}

			updatedTrades++
			return nil
		})

		if txErr != nil {
			// If the transaction itself failed, bubble that up or keep going
			logrus.Errorf("Transaction error for Trade %s: %v", tradeID, txErr)
			if err == nil {
				err = txErr
			}
		}
	}
	return
}
