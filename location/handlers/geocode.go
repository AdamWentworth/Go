// geocode.go

package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

func GeocodeHandler(db *pgxpool.Pool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		location := c.Query("location", "")
		logrus.Infof("Geocode request received for location: %s", location)

		if location == "" {
			logrus.Warn("location query parameter is required")
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "location query parameter is required",
			})
		}

		sql := `
			SELECT latitude, longitude
			FROM places
			WHERE name ILIKE $1
			ORDER BY admin_level ASC
			LIMIT 1;
		`

		var latitude, longitude float64
		err := db.QueryRow(context.Background(), sql, location).Scan(&latitude, &longitude)
		if err != nil {
			logrus.Warnf("No results found for location '%s'", location)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "location not found"})
		}

		logrus.Infof("Geocode result for '%s': lat=%f, lon=%f", location, latitude, longitude)
		return c.JSON(fiber.Map{
			"latitude":  latitude,
			"longitude": longitude,
		})
	}
}
