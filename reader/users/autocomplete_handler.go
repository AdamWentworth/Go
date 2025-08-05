// autocomplete_handler.go
package main

import (
	"strings"

	"github.com/gofiber/fiber/v2"
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
func AutocompleteTrainersHandler(c *fiber.Ctx) error {
	q := strings.TrimSpace(c.Query("q"))
	if len(q) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "q must be at least 2 characters",
		})
	}

	like := strings.ToLower(q) + "%"
	var rows []TrainerSuggestion
	if err := db.
		Table("users").
		Select(`username, pokemon_go_name, team, trainer_level`).
		Where("LOWER(username) LIKE ? OR LOWER(pokemon_go_name) LIKE ?", like, like).
		Order("username").
		Limit(10).
		Scan(&rows).Error; err != nil {

		logrus.Errorf("Autocomplete DB error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "database query failed",
		})
	}

	return c.JSON(rows)
}
