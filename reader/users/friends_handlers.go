package main

import (
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FriendSummary struct {
	UserID        string  `json:"user_id"`
	Username      string  `json:"username"`
	PokemonGoName *string `json:"pokemonGoName,omitempty"`
	Team          *string `json:"team,omitempty"`
	TrainerLevel  *uint8  `json:"trainer_level,omitempty"`
	FriendshipID  string  `json:"friendship_id"`
	Direction     string  `json:"direction,omitempty"`
}

type FriendsResponse struct {
	Friends  []FriendSummary `json:"friends"`
	Incoming []FriendSummary `json:"incoming"`
	Outgoing []FriendSummary `json:"outgoing"`
	Blocked  []FriendSummary `json:"blocked"`
}

func friendSummary(user User, profile UserProfile, friendshipID, direction string) FriendSummary {
	summary := FriendSummary{
		UserID: user.UserID, Username: user.Username,
		Team: user.Team, TrainerLevel: user.TrainerLevel,
		FriendshipID: friendshipID, Direction: direction,
	}
	if profile.ShowPokemonGoName {
		summary.PokemonGoName = user.PokemonGoName
	}
	return summary
}

func GetFriendsHandler(c fiber.Ctx) error {
	userID := viewerID(c)
	var friendships []Friendship
	if err := db.Where("user_id_low = ? OR user_id_high = ?", userID, userID).
		Order("updated_at DESC").
		Find(&friendships).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not load friends"})
	}
	var blocks []UserBlock
	if err := db.Where("blocker_user_id = ?", userID).Find(&blocks).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not load blocked trainers"})
	}

	userIDs := make([]string, 0, len(friendships)+len(blocks))
	for _, friendship := range friendships {
		if friendship.UserIDLow == userID {
			userIDs = append(userIDs, friendship.UserIDHigh)
		} else {
			userIDs = append(userIDs, friendship.UserIDLow)
		}
	}
	for _, block := range blocks {
		userIDs = append(userIDs, block.BlockedUserID)
	}
	var users []User
	if len(userIDs) > 0 {
		if err := db.Where("user_id IN ?", userIDs).Find(&users).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not load trainers"})
		}
	}
	byID := make(map[string]User, len(users))
	for _, user := range users {
		byID[user.UserID] = user
	}
	profilesByID := make(map[string]UserProfile, len(users))
	if len(userIDs) > 0 {
		var profiles []UserProfile
		if err := db.Where("user_id IN ?", userIDs).Find(&profiles).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not load trainer privacy"})
		}
		for _, profile := range profiles {
			profilesByID[profile.UserID] = profile
		}
	}
	profileFor := func(otherID string) UserProfile {
		if profile, ok := profilesByID[otherID]; ok {
			return profile
		}
		return defaultUserProfile(otherID)
	}

	response := FriendsResponse{
		Friends: []FriendSummary{}, Incoming: []FriendSummary{},
		Outgoing: []FriendSummary{}, Blocked: []FriendSummary{},
	}
	for _, friendship := range friendships {
		otherID := friendship.UserIDLow
		if otherID == userID {
			otherID = friendship.UserIDHigh
		}
		other, ok := byID[otherID]
		if !ok {
			continue
		}
		if friendship.Status == "accepted" {
			response.Friends = append(response.Friends, friendSummary(other, profileFor(otherID), friendship.FriendshipID, "accepted"))
		} else if friendship.RequestedBy == userID {
			response.Outgoing = append(response.Outgoing, friendSummary(other, profileFor(otherID), friendship.FriendshipID, "outgoing"))
		} else {
			response.Incoming = append(response.Incoming, friendSummary(other, profileFor(otherID), friendship.FriendshipID, "incoming"))
		}
	}
	for _, block := range blocks {
		if other, ok := byID[block.BlockedUserID]; ok {
			response.Blocked = append(response.Blocked, friendSummary(other, profileFor(block.BlockedUserID), "", "blocked"))
		}
	}
	return c.JSON(response)
}

type TrainerTargetRequest struct {
	Username string `json:"username"`
	UserID   string `json:"user_id"`
}

func targetUser(request TrainerTargetRequest) (User, error) {
	var user User
	var result *gorm.DB
	if strings.TrimSpace(request.UserID) != "" {
		result = db.Where("user_id = ?", strings.TrimSpace(request.UserID)).First(&user)
	} else {
		result = db.Where("LOWER(username) = ?", strings.ToLower(strings.TrimSpace(request.Username))).First(&user)
	}
	return user, result.Error
}

func CreateFriendRequestHandler(c fiber.Ctx) error {
	var request TrainerTargetRequest
	if err := c.Bind().Body(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Choose a trainer"})
	}
	target, err := targetUser(request)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Trainer not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not find trainer"})
	}
	requesterID := viewerID(c)
	if target.UserID == requesterID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "You are already you"})
	}
	targetPreferences, err := loadUserProfile(target.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not load trainer settings"})
	}
	if targetPreferences.FriendRequestPermission == "nobody" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": "This trainer is not accepting friend requests"})
	}
	blocked, err := usersAreBlocked(requesterID, target.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not check relationship"})
	}
	if blocked {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": "Friend request unavailable"})
	}
	existing, err := friendshipForUsers(requesterID, target.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not check relationship"})
	}
	if existing != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"message": "A friendship or request already exists"})
	}
	low, high := canonicalFriendPair(requesterID, target.UserID)
	friendship := Friendship{
		FriendshipID: uuid.NewString(), UserIDLow: low, UserIDHigh: high,
		RequestedBy: requesterID, Status: "pending",
	}
	if err := db.Create(&friendship).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not send friend request"})
	}
	return c.Status(fiber.StatusCreated).JSON(friendship)
}

func AcceptFriendRequestHandler(c fiber.Ctx) error {
	userID := viewerID(c)
	var friendship Friendship
	if err := db.Where("friendship_id = ? AND status = ?", c.Params("friendship_id"), "pending").
		First(&friendship).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Friend request not found"})
	}
	if friendship.RequestedBy == userID || (friendship.UserIDLow != userID && friendship.UserIDHigh != userID) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": "This request is not yours to accept"})
	}
	now := time.Now().UTC()
	if err := db.Model(&friendship).Updates(map[string]interface{}{
		"status": "accepted", "accepted_at": now,
	}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not accept friend request"})
	}
	return c.JSON(fiber.Map{"success": true})
}

func DeleteFriendRequestHandler(c fiber.Ctx) error {
	userID := viewerID(c)
	result := db.Where(
		"friendship_id = ? AND status = ? AND (user_id_low = ? OR user_id_high = ?)",
		c.Params("friendship_id"), "pending", userID, userID,
	).Delete(&Friendship{})
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not remove friend request"})
	}
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Friend request not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func RemoveFriendHandler(c fiber.Ctx) error {
	userID := viewerID(c)
	low, high := canonicalFriendPair(userID, c.Params("user_id"))
	result := db.Where("user_id_low = ? AND user_id_high = ? AND status = ?", low, high, "accepted").
		Delete(&Friendship{})
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not remove friend"})
	}
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Friend not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func BlockUserHandler(c fiber.Ctx) error {
	var request TrainerTargetRequest
	if err := c.Bind().Body(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Choose a trainer"})
	}
	target, err := targetUser(request)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Trainer not found"})
	}
	userID := viewerID(c)
	if target.UserID == userID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "You cannot block yourself"})
	}
	low, high := canonicalFriendPair(userID, target.UserID)
	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id_low = ? AND user_id_high = ?", low, high).Delete(&Friendship{}).Error; err != nil {
			return err
		}
		block := UserBlock{BlockerUserID: userID, BlockedUserID: target.UserID}
		if err := tx.Where(UserBlock{BlockerUserID: userID, BlockedUserID: target.UserID}).
			FirstOrCreate(&block).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not block trainer"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true})
}

func UnblockUserHandler(c fiber.Ctx) error {
	result := db.Where("blocker_user_id = ? AND blocked_user_id = ?", viewerID(c), c.Params("user_id")).
		Delete(&UserBlock{})
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not unblock trainer"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
