// autocomplete.go

package main

import (
	"context"
	"strings"

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

		// Split query into tokens. We'll assume a maximum of three tokens for demonstration:
		// 1 token: match on name
		// 2 tokens: match on name and either state_or_province or country
		// 3+ tokens: further refinement as needed
		tokens := strings.Fields(queryParam)

		var conditions []string
		var params []interface{}

		// Always try to match the first token against name.
		// We'll use ILIKE with unaccent for flexibility.
		conditions = append(conditions, "unaccent(p.name) ILIKE unaccent($1)")
		params = append(params, tokens[0]+"%")

		// If there's a second token, try to match it against either state_province or country name.
		if len(tokens) >= 2 {
			// We'll try state_or_province first and country name as well.
			// We'll use a condition that matches either field to give broader results.
			conditions = append(conditions, "(unaccent(p.state_or_province) ILIKE unaccent($2) OR unaccent(c.name) ILIKE unaccent($2))")
			params = append(params, tokens[1]+"%")
		}

		// If there's a third token, you can decide how to handle it. For demonstration, let's say
		// we again try matching it to state_or_province or country. Or you could choose a different logic:
		if len(tokens) >= 3 {
			conditions = append(conditions, "(unaccent(p.state_or_province) ILIKE unaccent($3) OR unaccent(c.name) ILIKE unaccent($3))")
			params = append(params, tokens[2]+"%")
		}

		// Construct final SQL with dynamic WHERE clause
		// For example, if we have just one token:
		//  WHERE unaccent(p.name) ILIKE unaccent($1)
		//
		// If we have two tokens:
		//  WHERE unaccent(p.name) ILIKE unaccent($1)
		//    AND (unaccent(p.state_or_province) ILIKE unaccent($2) OR unaccent(c.name) ILIKE unaccent($2))
		//
		// And so forth.

		baseSQL := `
            SELECT p.id, p.name, p.state_or_province, c.name AS country, p.population, p.latitude, p.longitude, ST_AsText(p.boundary) AS boundary
            FROM places p
            LEFT JOIN countries c ON p.country_id = c.id
        `

		whereClause := "WHERE " + strings.Join(conditions, " AND ")

		// Order by how well the name starts with the query, then by population, etc.
		// Note that our first param is always the name token, so we can still do the order by trick:
		orderClause := `
            ORDER BY p.name ILIKE $1 || '%' DESC, p.population DESC NULLS LAST, p.admin_level ASC
            LIMIT 10
        `

		sql := baseSQL + whereClause + orderClause

		rows, err := db.Query(context.Background(), sql, params...)
		if err != nil {
			logrus.Errorf("Error querying database for autocomplete: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
		defer rows.Close()

		var results []map[string]interface{}

		for rows.Next() {
			var id int64
			var name, state, country, boundary *string
			var population *int64
			var latitude, longitude *float64

			if err := rows.Scan(&id, &name, &state, &country, &population, &latitude, &longitude, &boundary); err != nil {
				logrus.Errorf("Error scanning row: %v", err)
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
			}

			result := map[string]interface{}{
				"id":                id,
				"name":              name,
				"state_or_province": state,
				"country":           country,
				"population":        population,
				"latitude":          latitude,
				"longitude":         longitude,
				"boundary":          boundary,
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
