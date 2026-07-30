package main

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

const maxPageSize = 100

var errInvalidCursor = errors.New("invalid cursor")

func requestedPageSize(c fiber.Ctx) (int, bool, error) {
	raw := c.Query("limit")
	if raw == "" {
		return 0, false, nil
	}
	limit, err := strconv.Atoi(raw)
	if err != nil || limit < 1 || limit > maxPageSize {
		return 0, true, errors.New("limit must be between 1 and 100")
	}
	return limit, true, nil
}

func encodeCursor(value any) string {
	raw, _ := json.Marshal(value)
	return base64.RawURLEncoding.EncodeToString(raw)
}

func decodeCursor(raw string, target any) error {
	decoded, err := base64.RawURLEncoding.DecodeString(raw)
	if err != nil || json.Unmarshal(decoded, target) != nil {
		return errInvalidCursor
	}
	return nil
}
