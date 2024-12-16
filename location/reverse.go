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

		logrus.Infof("Reverse geocode request received for lat=%s, lon=%s", latStr, lonStr)

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

		sql := `
			SELECT p.name, p.state_or_province, c.name AS country
			FROM places p
			LEFT JOIN countries c ON p.country_id = c.id
			WHERE ST_Contains(p.boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326))
			ORDER BY p.admin_level DESC
			LIMIT 1;
		`

		var name, state, country *string
		err := db.QueryRow(context.Background(), sql, lon, lat).Scan(&name, &state, &country)
		if err != nil {
			logrus.Warnf("No place found for lat=%f, lon=%f. Trying country...", lat, lon)
			// Try countries
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

			logrus.Infof("Found a country match (no place) for lat=%f, lon=%f: %s", lat, lon, *cName)
			return c.JSON(fiber.Map{
				"name":              nil,
				"state_or_province": nil,
				"country":           cName,
				"country_code":      cCode,
			})
		}

		logrus.Infof("Reverse geocode result for lat=%f, lon=%f: name=%v, state=%v, country=%v",
			lat, lon, name, state, country)
		return c.JSON(fiber.Map{
			"name":              name,
			"state_or_province": state,
			"country":           country,
		})
	}
}
