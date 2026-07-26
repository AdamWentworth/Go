// public_snapshot_handler.go
package main

import (
	"strings"

	"github.com/gofiber/fiber/v3"
)

// GET /api/public/users/:username
func GetPublicSnapshotByUsername(c fiber.Ctx) error {
	username := c.Params("username")

	var user User
	if err := db.Where("LOWER(username)=?", strings.ToLower(username)).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}
	profile, err := loadUserProfile(user.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve privacy settings"})
	}
	relationship, _, err := relationshipForUsers(viewerID(c), user.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve relationship"})
	}
	if !visibilityAllows(profile.CollectionVisibility, relationship) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "This trainer's collection is private"})
	}
	u := publicUserFromUser(user, profile, relationship)

	// fetch that trainer's instances only
	var inst []PokemonInstance
	if err := db.Where("user_id = ?", user.UserID).Find(&inst).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve instances"})
	}

	out := make(map[string]interface{}, len(inst))
	for _, in := range inst {
		out[in.InstanceID] = instanceToMap(in)
	}

	return c.JSON(fiber.Map{
		"user":      u,
		"instances": out,
	})
}
