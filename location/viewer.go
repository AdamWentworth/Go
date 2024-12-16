// viewer.go

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

type GeoJSONFeature struct {
	Type       string                 `json:"type"`
	Geometry   json.RawMessage        `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

func ViewerHandler(db *pgxpool.Pool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		originalCountry := c.Params("country")
		originalState := c.Params("state")
		originalCity := c.Params("name")

		// Decode URL-encoded parameters
		countryName, err := url.QueryUnescape(originalCountry)
		if err != nil {
			logrus.Warnf("Could not decode country param: %v", err)
			countryName = originalCountry
		}

		stateName, err := url.QueryUnescape(originalState)
		if err != nil {
			logrus.Warnf("Could not decode state param: %v", err)
			stateName = originalState
		}

		cityName, err := url.QueryUnescape(originalCity)
		if err != nil {
			logrus.Warnf("Could not decode city param: %v", err)
			cityName = originalCity
		}

		// Normalize to lowercase for querying
		countryName = strings.ToLower(countryName)
		if stateName != "" {
			stateName = strings.ToLower(stateName)
		}
		if cityName != "" {
			cityName = strings.ToLower(cityName)
		}

		// Use %q to safely log parameters containing %
		logrus.Infof("Viewer request: country=%q (%q), state=%q (%q), city=%q (%q)",
			originalCountry, countryName, originalState, stateName, originalCity, cityName)

		var query string
		var params []interface{}

		if cityName != "" && stateName != "" {
			query = `
                SELECT ST_AsGeoJSON(places.boundary) AS geojson
                FROM places
                INNER JOIN countries ON places.country_id = countries.id
                WHERE LOWER(places.name) = LOWER($1)
                  AND LOWER(places.state_or_province) = LOWER($2)
                  AND LOWER(countries.name) = LOWER($3)
            `
			params = []interface{}{cityName, stateName, countryName}
		} else if stateName != "" {
			query = `
                SELECT ST_AsGeoJSON(places.boundary) AS geojson
                FROM places
                INNER JOIN countries ON places.country_id = countries.id
                WHERE LOWER(places.state_or_province) = LOWER($1)
                  AND LOWER(countries.name) = LOWER($2)
            `
			params = []interface{}{stateName, countryName}
		} else {
			// Just country
			query = `
                SELECT ST_AsGeoJSON(countries.boundary) AS geojson
                FROM countries
                WHERE LOWER(countries.name) = LOWER($1)
            `
			params = []interface{}{countryName}
		}

		var geojson sql.NullString
		err = db.QueryRow(context.Background(), query, params...).Scan(&geojson)
		if err != nil || !geojson.Valid {
			logrus.Warnf("No boundary found for: country=%q, state=%q, city=%q",
				countryName, stateName, cityName)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Boundary not found for the specified location."})
		}

		logrus.Infof("Boundary found for request. Returning GeoJSON feature.")
		feature := GeoJSONFeature{
			Type:     "Feature",
			Geometry: json.RawMessage(geojson.String),
			Properties: map[string]interface{}{
				"country": countryName,
				"state":   stateName,
				"city":    cityName,
			},
		}

		return c.JSON(feature)
	}
}
