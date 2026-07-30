package main

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

type ClientInvalidation struct {
	Type     string `json:"type"`
	Username string `json:"username,omitempty"`
}

type clientInvalidationPayload struct {
	Invalidations []ClientInvalidation `json:"invalidations"`
}

func friendshipInvalidations(usernames ...string) []ClientInvalidation {
	out := []ClientInvalidation{{Type: "friends"}}
	for _, username := range usernames {
		if username != "" {
			out = append(out, ClientInvalidation{Type: "profile", Username: username})
		}
	}
	return out
}

func enqueueSocialInvalidation(
	tx *gorm.DB,
	c fiber.Ctx,
	aggregateType string,
	aggregateID string,
	eventType string,
	recipients []string,
	invalidations []ClientInvalidation,
) error {
	return enqueueApplicationEvent(
		tx, c, aggregateType, aggregateID, eventType, recipients,
		clientInvalidationPayload{Invalidations: invalidations},
	)
}

func usernamesForUsers(tx *gorm.DB, userIDs ...string) ([]string, error) {
	var users []User
	if err := tx.Select("user_id", "username").Where("user_id IN ?", userIDs).Find(&users).Error; err != nil {
		return nil, err
	}
	byID := make(map[string]string, len(users))
	for _, user := range users {
		byID[user.UserID] = user.Username
	}
	out := make([]string, 0, len(userIDs))
	for _, userID := range userIDs {
		out = append(out, byID[userID])
	}
	return out, nil
}

func profileEventRecipients(tx *gorm.DB, userID string) ([]string, error) {
	var friendships []Friendship
	if err := tx.Where(
		"status = ? AND (user_id_low = ? OR user_id_high = ?)",
		"accepted", userID, userID,
	).Find(&friendships).Error; err != nil {
		return nil, err
	}
	recipients := []string{userID}
	for _, friendship := range friendships {
		if friendship.UserIDLow == userID {
			recipients = append(recipients, friendship.UserIDHigh)
		} else {
			recipients = append(recipients, friendship.UserIDLow)
		}
	}
	return recipients, nil
}
