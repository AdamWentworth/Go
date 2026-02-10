package main

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// GET /api/instances/by-username/:username (protected)
func GetInstancesByUsername(c *fiber.Ctx) error {
	raw := strings.TrimSpace(c.Params("username"))
	if raw == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing username"})
	}

	// Case-insensitive lookup so frontend can safely normalize URLs.
	var user User
	err := db.
		Table("users").
		Select("user_id, username").
		Where("LOWER(username)=?", strings.ToLower(raw)).
		First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve user"})
	}

	var instances []PokemonInstance
	if err := db.Where("user_id = ?", user.UserID).Find(&instances).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve instances"})
	}

	out := make(map[string]interface{}, len(instances))
	var latest time.Time
	for _, in := range instances {
		item := instanceToMap(in)
		item["instance_id"] = in.InstanceID
		item["user_id"] = user.UserID
		item["username"] = user.Username
		// Legacy aliases still used in parts of the frontend.
		item["is_owned"] = in.IsCaught
		item["is_unowned"] = !in.IsCaught
		out[in.InstanceID] = item

		if t := lastUpdateToTime(in.LastUpdate); t.After(latest) {
			latest = t
		}
	}

	etag := fmt.Sprintf("%s:%d", user.UserID, len(instances))
	if !latest.IsZero() {
		etag = fmt.Sprintf("%s:%d", user.UserID, latest.UnixNano())
	}
	if c.Get("If-None-Match") == etag {
		return c.Status(fiber.StatusNotModified).Send(nil)
	}
	c.Set("ETag", etag)

	return c.JSON(fiber.Map{
		"username":  user.Username, // canonical casing
		"instances": out,
	})
}

// Backward-compat alias while frontend migrates naming.
// GET /api/ownershipData/username/:username (protected)
func GetOwnershipDataByUsername(c *fiber.Ctx) error {
	return GetInstancesByUsername(c)
}
