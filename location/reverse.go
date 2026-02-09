// reverse.go

package main

import (
	"context"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

func ReverseGeocodeHandler(db *pgxpool.Pool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		latStr := c.Query("lat", "")
		lonStr := c.Query("lon", "")

		logrus.Infof("Reverse geocode request lat=%s, lon=%s", latStr, lonStr)

		if latStr == "" || lonStr == "" {
			logrus.Warn("lat and lon query parameters are required")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "lat and lon query parameters are required",
			})
		}

		lat, errLat := strconv.ParseFloat(latStr, 64)
		lon, errLon := strconv.ParseFloat(lonStr, 64)
		if errLat != nil || errLon != nil {
			logrus.Warn("Invalid lat or lon values")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid lat or lon values",
			})
		}
		if lat < -90 || lat > 90 || lon < -180 || lon > 180 {
			logrus.Warn("lat/lon values out of range")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "lat or lon values are out of range",
			})
		}
		if db == nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "database unavailable",
			})
		}

		sql := `
			SELECT p.name, p.state_or_province, c.name AS country, p.admin_level
			FROM places p
			LEFT JOIN countries c ON p.country_id = c.id
			WHERE ST_Contains(p.boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326))
			ORDER BY p.admin_level DESC;
		`

		rows, err := db.Query(context.Background(), sql, lon, lat)
		if err != nil {
			logrus.Errorf("Error querying places for lat=%f, lon=%f: %v", lat, lon, err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to query location data",
			})
		}
		defer rows.Close()

		var locations []fiber.Map

		for rows.Next() {
			var name, state, country *string
			var adminLevel *int64

			err := rows.Scan(&name, &state, &country, &adminLevel)
			if err != nil {
				logrus.Errorf("Error scanning location row: %v", err)
				continue
			}

			locations = append(locations, fiber.Map{
				"name":              name,
				"state_or_province": state,
				"country":           country,
				"admin_level":       adminLevel,
			})
		}

		if len(locations) == 0 {
			// If no places found, try to match a country
			logrus.Warnf("No places found for lat=%f, lon=%f. Trying country...", lat, lon)
			sqlCountries := `
				SELECT name, country_code 
				FROM countries
				WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326))
				LIMIT 1;
			`
			var cName, cCode *string
			err2 := db.QueryRow(context.Background(), sqlCountries, lon, lat).Scan(&cName, &cCode)
			if err2 != nil || cName == nil {
				logrus.Warnf("No location found at all for lat=%f, lon=%f", lat, lon)
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
					"error": "No location found for these coordinates",
				})
			}

			logrus.Infof("Found a country match for lat=%f, lon=%f: %s", lat, lon, *cName)
			return c.JSON(fiber.Map{
				"locations": []fiber.Map{
					{
						"name":              nil,
						"state_or_province": nil,
						"country":           cName,
						"admin_level":       0,
					},
				},
			})
		}

		logrus.Infof("Reverse geocode result for lat=%f, lon=%f: %d locations found", lat, lon, len(locations))
		return c.JSON(fiber.Map{
			"locations": locations,
		})
	}
}
