// autocomplete.go

package main

import (
	"context"
	"strings"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

var activeQuery sync.Map // Track the most specific query

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

		// Register this query as the most recent
		activeQuery.Store("latestQuery", queryParam)

		// Convert the query to a full-text search format
		tokens := strings.Fields(queryParam)
		tsQuery := strings.Join(tokens, ":* & ") + ":*"

		// Extract the first token for prioritization
		firstToken := strings.ToLower(tokens[0]) // Assumes at least one token exists

		// Create exact and partial match strings
		exactMatch := queryParam
		partialMatch := "%" + queryParam + "%"

		sql := `
            SELECT p.id, 
                   p.name, 
                   p.state_or_province, 
                   c.name AS country, 
                   p.population, 
                   p.latitude, 
                   p.longitude, 
                   ST_AsText(p.boundary) AS boundary, 
                   p.admin_level,
                   ts_rank_cd(p.search_tsv, to_tsquery($1), 32) +
                   CASE
                       WHEN lower(p.name) = lower($2) THEN 5.0 -- Strongest boost for exact name match
                       WHEN lower(split_part(p.name, ' ', 1)) = lower($4) THEN 4.0 -- Boost for first token match
                       WHEN lower(p.name) LIKE lower($3) THEN 2.0 -- Boost for partial match
                       ELSE -1.0 -- Penalize mismatched results
                   END +
                   COALESCE(p.population / 1000000.0, 0) AS rank -- Normalize population contribution
            FROM places p
            LEFT JOIN countries c ON p.country_id = c.id
            WHERE p.search_tsv @@ to_tsquery($1)
            ORDER BY rank DESC, 
                     p.population DESC NULLS LAST, 
                     p.admin_level ASC,
                     p.osm_id ASC -- Final tie breaker
            LIMIT 5;
        `

		rows, err := db.Query(context.Background(), sql, tsQuery, exactMatch, partialMatch, firstToken)
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
			var adminLevel *int
			var rank float64

			if err := rows.Scan(&id, &name, &state, &country, &population, &latitude, &longitude, &boundary, &adminLevel, &rank); err != nil {
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
				"admin_level":       adminLevel,
				"rank":              rank,
			}
			results = append(results, result)
		}

		if err := rows.Err(); err != nil {
			logrus.Errorf("Error iterating over rows: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}

		// Ensure we only return results for the most specific query
		latestQuery, _ := activeQuery.Load("latestQuery")
		if latestQuery != queryParam {
			logrus.Warnf("Ignoring results for outdated query: %s", queryParam)
			return nil // Ignore outdated results
		}

		logrus.Infof("Autocomplete found %d results for query '%s'", len(results), queryParam)
		return c.JSON(results)
	}
}
