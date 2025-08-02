// autocomplete_handler.go
package main

import (
	"strings"
	"unicode/utf8"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

// TrainerSuggestion is what the frontend autocompleter expects.
type TrainerSuggestion struct {
	Username      string  `json:"username"`
	PokemonGoName *string `json:"pokemonGoName,omitempty"`
}

// GET /api/autocomplete-trainers?q=<partial>
func AutocompleteTrainersHandler(c *fiber.Ctx) error {
	rawQuery := strings.TrimSpace(c.Query("q"))

	// Length limits to avoid abuse
	if n := utf8.RuneCountInString(rawQuery); n < 2 || n > 50 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "query parameter 'q' must be between 2 and 50 characters",
		})
	}

	// Escape LIKE-wildcards so searches for `%` or `_` are literal
	like := escapeLike(rawQuery) + "%"

	var users []User
	if err := db.
		Select("username, pokemon_go_name").
		Where("(username LIKE ? ESCAPE '\\' OR pokemon_go_name LIKE ? ESCAPE '\\')", like, like).
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
