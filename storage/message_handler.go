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
	createdCount, updatedCount, deletedCount, err := parseAndUpsertPokemon(data, userID, messageTraceID)
	if err != nil {
		logrus.Errorf("Failed parsing/upserting Pokémon for user %s: %v", userID, err)
	}

	// 3) Process Trades
	createdTrades, updatedTrades, droppedTrades, errTrades := parseAndUpsertTrades(data)
	if errTrades != nil {
		logrus.Errorf("Failed parsing/upserting Trades: %v", errTrades)
	}

	// 4) Log summary
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

	if createdTrades > 0 {
		actions = append(actions, fmt.Sprintf("created %d trades", createdTrades))
	}
	if updatedTrades > 0 {
		actions = append(actions, fmt.Sprintf("updated %d trades", updatedTrades))
	}
	if droppedTrades > 0 {
		actions = append(actions, fmt.Sprintf("dropped %d trades", droppedTrades))
	}

	summary := "no changes"
	if len(actions) > 0 {
		summary = strings.Join(actions, ", ")
	}
	logrus.Infof("User %s %s with status 200", username, summary)
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
