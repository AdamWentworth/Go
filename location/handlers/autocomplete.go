// autocomplete.go

package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

func AutocompleteHandler(db *pgxpool.Pool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		queryParam := c.Query("query", "")
		logrus.Infof("Autocomplete request received with query: %s", queryParam)

		if len(queryParam) < 3 {
			logrus.Warn("Query parameter must be at least 3 characters")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "query parameter must be at least 3 characters",
			})
		}

		sql := `
			SELECT p.name, p.state_or_province, c.name AS country, p.population
			FROM places p
			LEFT JOIN countries c ON p.country_id = c.id
			WHERE unaccent(p.name) ILIKE unaccent($1)
			ORDER BY p.name ILIKE $1 || '%' DESC, p.population DESC NULLS LAST, p.admin_level ASC
			LIMIT 10;
		`

		rows, err := db.Query(context.Background(), sql, queryParam+"%")
		if err != nil {
			logrus.Errorf("Error querying database for autocomplete: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		defer rows.Close()

		var results []map[string]interface{}

		for rows.Next() {
			var name, state, country *string
			var population *int
			if err := rows.Scan(&name, &state, &country, &population); err != nil {
				logrus.Errorf("Error scanning row: %v", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
			}
			result := map[string]interface{}{
				"name":              name,
				"state_or_province": state,
				"country":           country,
				"population":        population,
			}
			results = append(results, result)
		}

		if err := rows.Err(); err != nil {
			logrus.Errorf("Error iterating over rows: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		logrus.Infof("Autocomplete found %d results for query '%s'", len(results), queryParam)
		return c.JSON(results)
	}
}
