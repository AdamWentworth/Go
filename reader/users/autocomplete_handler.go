// autocomplete_handler.go
package main

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

// TrainerSuggestion is what the frontend autocompleter expects.
type TrainerSuggestion struct {
	Username      string  `json:"username"`
	PokemonGoName *string `json:"pokemonGoName,omitempty"`
}

// GET /autocomplete-trainers?q=<partial>
func AutocompleteTrainersHandler(c *fiber.Ctx) error {
	query := strings.TrimSpace(c.Query("q"))
	if len(query) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "query parameter 'q' must be at least 2 characters",
		})
	}

	like := query + "%"
	var users []User

	if err := db.
		Select("username, pokemon_go_name").
		Where("username LIKE ? OR pokemon_go_name LIKE ?", like, like).
		Order("username").
		Limit(10).
		Find(&users).Error; err != nil {

		logrus.Errorf("AutocompleteTrainersHandler DB error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "database query failed",
		})
	}

	suggestions := make([]TrainerSuggestion, len(users))
	for i, u := range users {
		suggestions[i] = TrainerSuggestion{
			Username:      u.Username,
			PokemonGoName: u.PokemonGoName,
		}
	}

	return c.JSON(suggestions)
}
