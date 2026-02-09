// geocode.go

package main

import (
	"context"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

func GeocodeHandler(db *pgxpool.Pool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		query := c.Query("q", "")
		if query == "" {
			query = c.Query("query", "")
		}

		logrus.Infof("Geocode request received for q=%s", query)

		if query == "" {
			logrus.Warn("q query parameter is required")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"features": []interface{}{},
			})
		}
		if len(query) > 256 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"features": []interface{}{},
			})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"features": []interface{}{},
			})
		}

		// Extract the first part of the query before any commas
		// e.g. "Vancouver, British Columbia, Canada" -> "Vancouver"
		parts := strings.Split(query, ",")
		cityName := strings.TrimSpace(parts[0])

		// Use a wildcard search like autocomplete does
		sql := `
			SELECT latitude, longitude
			FROM places
			WHERE unaccent(name) ILIKE unaccent($1)
			ORDER BY population DESC NULLS LAST, admin_level ASC
			LIMIT 1;
		`

		var latitude, longitude float64
		err := db.QueryRow(context.Background(), sql, cityName+"%").Scan(&latitude, &longitude)
		if err != nil {
			// If no direct match starting with cityName, try a more flexible wildcard
			err = db.QueryRow(context.Background(), sql, "%"+cityName+"%").Scan(&latitude, &longitude)
			if err != nil {
				logrus.Warnf("No results found for q='%s'", query)
				return c.JSON(fiber.Map{
					"features": []interface{}{},
				})
			}
		}

		// Return Photon-like structure
		return c.JSON(fiber.Map{
			"features": []fiber.Map{
				{
					"type": "Feature",
					"geometry": fiber.Map{
						"type":        "Point",
						"coordinates": []float64{longitude, latitude},
					},
					"properties": fiber.Map{
						"name": query, // We can return the original query here
					},
				},
			},
		})
	}
}
