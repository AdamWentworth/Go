// autocomplete.go

package main

import (
	"context"
	"math"
	"strings"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

// Define the shared state
type AutocompleteState struct {
	latestQuery   string
	latestResults []map[string]interface{}
	mu            sync.RWMutex
}

var state = AutocompleteState{}

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
		if len(queryParam) > 128 {
			logrus.Warn("Query parameter exceeds maximum length")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "query parameter must be 128 characters or fewer",
			})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "database unavailable",
			})
		}

		// Update the latest query
		state.mu.Lock()
		state.latestQuery = queryParam
		state.mu.Unlock()

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
                   COALESCE(p.population / 1000000.0, 0) AS rank
            FROM places p
            LEFT JOIN countries c ON p.country_id = c.id
            WHERE p.search_tsv @@ to_tsquery($1)
            ORDER BY rank DESC, 
                     p.population DESC NULLS LAST, 
                     p.admin_level ASC,
                     p.osm_id ASC
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

			// Handle NaN values
			if math.IsNaN(rank) {
				rank = 0 // or any default value
			}
			if latitude != nil && math.IsNaN(*latitude) {
				*latitude = 0 // or any default value
			}
			if longitude != nil && math.IsNaN(*longitude) {
				*longitude = 0 // or any default value
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

		// Determine if this query is the latest
		state.mu.RLock()
		isLatest := queryParam == state.latestQuery
		state.mu.RUnlock()

		if isLatest {
			// Update the latest results
			state.mu.Lock()
			state.latestResults = results
			state.mu.Unlock()

			logrus.Infof("Autocomplete found %d results for query '%s'", len(results), queryParam)
			return c.JSON(results)
		} else {
			// Respond with the latest results instead of the outdated query's results
			state.mu.RLock()
			latestResults := state.latestResults
			state.mu.RUnlock()

			logrus.Warnf("Ignoring results for outdated query: %s, sending latest results instead", queryParam)
			return c.JSON(latestResults)
		}
	}
}
