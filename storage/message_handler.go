// message_handler.go

package main

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ---------------------
// MAIN HANDLER
// ---------------------

// message_handler.go

func HandleMessage(data map[string]interface{}) error {
	// Extract message-level trace_id
	messageTraceID := fmt.Sprintf("%v", data["trace_id"])

	// 1) Upsert / verify user
	userID, username, lat, lng := parseUserData(data)
	syncBatchID := strings.TrimSpace(fmt.Sprintf("%v", data["sync_batch_id"]))
	if syncBatchID != "" && syncBatchID != "<nil>" {
		var count int64
		if err := DB.Model(&ProcessedSyncBatch{}).
			Where("sync_batch_id = ? AND user_id = ?", syncBatchID, userID).
			Count(&count).Error; err != nil {
			return fmt.Errorf("check sync batch idempotency: %w", err)
		}
		if count > 0 {
			syncBatchesTotal.WithLabelValues("duplicate").Inc()
			logrus.Infof("Ignoring already processed sync batch %s for user %s", syncBatchID, userID)
			return nil
		}
	}
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

	// 2) Process Pokemon updates with messageTraceID
	createdCount, updatedCount, deletedCount, affectedVariantIDs, err := parseAndUpsertPokemon(data, userID, messageTraceID)
	if err != nil {
		return fmt.Errorf("failed parsing/upserting Pokémon for user %s: %w", userID, err)
	}
	if len(affectedVariantIDs) > 0 {
		if refreshErr := refreshRankingsForVariants(DB, affectedVariantIDs); refreshErr != nil {
			// The hourly full reconciliation repairs transient aggregation failures
			// without replaying an otherwise successfully persisted user update.
			logrus.Errorf(
				"Failed refreshing Pokemon rankings for %d variants: %v",
				len(affectedVariantIDs),
				refreshErr,
			)
		}
	}

	// 3) Log summary
	actions := []string{}
	if createdCount > 0 {
		actions = append(actions, fmt.Sprintf("created %d Pokémon", createdCount))
	}
	if updatedCount > 0 {
		actions = append(actions, fmt.Sprintf("updated %d Pokémon", updatedCount))
	}
	if deletedCount > 0 {
		actions = append(actions, fmt.Sprintf("dropped %d Pokémon", deletedCount))
	}

	summary := "no changes"
	if len(actions) > 0 {
		summary = strings.Join(actions, ", ")
	}
	logrus.Infof("User %s %s with status 200", username, summary)
	if syncBatchID != "" && syncBatchID != "<nil>" {
		if err := DB.Create(&ProcessedSyncBatch{
			SyncBatchID: syncBatchID,
			UserID:      userID,
		}).Error; err != nil {
			return fmt.Errorf("record processed sync batch: %w", err)
		}
	}
	syncBatchesTotal.WithLabelValues("processed").Inc()
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
