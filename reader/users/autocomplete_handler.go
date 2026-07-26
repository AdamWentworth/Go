// autocomplete_handler.go
package main

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/sirupsen/logrus"
)

// what the UI needs for suggestions – keep it slim
type TrainerSuggestion struct {
	Username      string  `json:"username"`
	PokemonGoName *string `json:"pokemonGoName,omitempty"`
	Team          *string `json:"team,omitempty"`
	TrainerLevel  *uint8  `json:"trainer_level,omitempty"`
}

// GET /api/autocomplete-trainers?q=<partial>
func AutocompleteTrainersHandler(c fiber.Ctx) error {
	q := strings.TrimSpace(c.Query("q"))
	if len(q) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "q must be at least 2 characters",
		})
	}

	like := strings.ToLower(q) + "%"
	viewer := viewerID(c)
	var rows []TrainerSuggestion
	query := db.
		Table("users").
		Joins("LEFT JOIN user_profiles ON user_profiles.user_id = users.user_id").
		Select(`
			users.username,
			CASE
				WHEN COALESCE(user_profiles.profile_visibility, 'public') = 'public'
					AND COALESCE(user_profiles.show_pokemon_go_name, 1) = 1
				THEN users.pokemon_go_name
				ELSE NULL
			END AS pokemon_go_name,
			CASE
				WHEN COALESCE(user_profiles.profile_visibility, 'public') = 'public'
				THEN users.team
				ELSE NULL
			END AS team,
			CASE
				WHEN COALESCE(user_profiles.profile_visibility, 'public') = 'public'
				THEN users.trainer_level
				ELSE NULL
			END AS trainer_level`).
		Where(`
			LOWER(users.username) LIKE ?
			OR (
				COALESCE(user_profiles.profile_visibility, 'public') = 'public'
				AND
				COALESCE(user_profiles.show_pokemon_go_name, 1) = 1
				AND LOWER(users.pokemon_go_name) LIKE ?
			)`, like, like)
	if viewer != "" {
		query = query.
			Where("users.user_id <> ?", viewer).
			Where(`
				NOT EXISTS (
					SELECT 1
					FROM user_blocks
					WHERE
						(blocker_user_id = ? AND blocked_user_id = users.user_id)
						OR
						(blocker_user_id = users.user_id AND blocked_user_id = ?)
				)`, viewer, viewer)
	}
	if err := query.
		Order("users.username").
		Limit(10).
		Scan(&rows).Error; err != nil {

		logrus.Errorf("Autocomplete DB error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "database query failed",
		})
	}

	return c.JSON(rows)
}
