// public_snapshot_handler.go
package main

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// GET /api/public/users/:username
func GetPublicSnapshotByUsername(c *fiber.Ctx) error {
	username := c.Params("username")

	// public-facing user slice
	var u PublicUser
	if err := db.
		Table("users").
		Select(`user_id, username, pokemon_go_name, team, trainer_level, total_xp,
		        pogo_started_on, app_joined_at,
		        highlight1_instance_id  AS highlight1,
		        highlight2_instance_id  AS highlight2,
		        highlight3_instance_id  AS highlight3,
		        highlight4_instance_id  AS highlight4,
		        highlight5_instance_id  AS highlight5,
		        highlight6_instance_id  AS highlight6`).
		Where("LOWER(username)=?", strings.ToLower(username)).
		Scan(&u).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	// fetch that trainer's instances only
	var inst []PokemonInstance
	if err := db.Where("user_id = ?", u.UserID).Find(&inst).Error; err != nil {
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
