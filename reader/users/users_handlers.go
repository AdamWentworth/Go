// users_handlers.go

package main

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"gorm.io/gorm/clause" // <‑‑‑‑‑ new
)

// ---------- request / response DTOs ----------

type UpdateUserRequest struct {
	Username      string  `json:"username"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	PokemonGoName *string `json:"pokemonGoName"`
}

type UpdateUserResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	User    *User  `json:"user,omitempty"`
}

// ---------- handler ----------

func UpdateUserHandler(c *fiber.Ctx) error {
	userID := c.Params("user_id")
	if userID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Missing user_id in URL parameters",
		})
	}

	authenticatedUserID := c.Locals("user_id").(string)
	if authenticatedUserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(UpdateUserResponse{
			Success: false,
			Message: "You are not authorized to update this user's details",
		})
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Invalid request body",
		})
	}

	// ---------------- validation ----------------
	if len(req.Username) < 3 || len(req.Username) > 30 {
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Username must be between 3 and 30 characters",
		})
	}

	// clash check for username (same as before)
	var clash User
	err := db.Where("username = ? AND user_id <> ?", req.Username, userID).
		First(&clash).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUserResponse{
			Success: false,
			Message: "Internal server error",
		})
	}
	if clash.UserID != "" {
		return c.Status(fiber.StatusConflict).JSON(UpdateUserResponse{
			Success: false,
			Message: "Username is already taken",
		})
	}

	// ---------------- upsert (insert‑or‑update) ----------------
	newRow := User{
		UserID:        userID,
		Username:      req.Username,
		PokemonGoName: req.PokemonGoName,
	}
	if req.Latitude != 0 || req.Longitude != 0 {
		newRow.Latitude = &req.Latitude
		newRow.Longitude = &req.Longitude
	}

	const maxRetries = 3
	var opErr error
	for i := 1; i <= maxRetries; i++ {
		opErr = db.
			Clauses(clause.OnConflict{
				Columns: []clause.Column{{Name: "user_id"}},
				DoUpdates: clause.AssignmentColumns([]string{
					"username", "pokemon_go_name", "latitude", "longitude",
				}),
			}).
			Create(&newRow).Error

		if opErr == nil {
			break // success
		}

		if !isTransientError(opErr) {
			break // non‑transient: no benefit in retrying
		}
		logrus.Warnf("UpdateUserHandler: transient DB error (%v) – retry %d/%d",
			opErr, i, maxRetries)
		time.Sleep(time.Duration(i) * time.Second)
	}

	if opErr != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUserResponse{
			Success: false,
			Message: "Failed to create or update user in secondary DB",
		})
	}

	// fetch the definitive row (includes NULLable coords etc.)
	var saved User
	if err := db.First(&saved, "user_id = ?", userID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUserResponse{
			Success: false,
			Message: "Failed to retrieve saved user",
		})
	}

	return c.Status(fiber.StatusOK).JSON(UpdateUserResponse{
		Success: true,
		Message: "User created / updated successfully",
		User:    &saved,
	})
}
