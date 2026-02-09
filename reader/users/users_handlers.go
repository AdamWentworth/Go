// users_handlers.go
package main

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ---------- request / response DTOs ----------

type UpdateUserRequest struct {
	Username      string  `json:"username"`
	PokemonGoName *string `json:"pokemonGoName"`
	Team          *string `json:"team"`
	TrainerLevel  *uint8  `json:"trainer_level"`
	TotalXP       *uint64 `json:"total_xp"`
	PogoStartedOn *string `json:"pogo_started_on"` // RFC-3339

	// location (all optional)
	AllowLocation *bool    `json:"allow_location"`
	Location      *string  `json:"location"`
	Latitude      *float64 `json:"latitude"`
	Longitude     *float64 `json:"longitude"`

	// highlights
	Highlight1 *string `json:"highlight1_instance_id"`
	Highlight2 *string `json:"highlight2_instance_id"`
	Highlight3 *string `json:"highlight3_instance_id"`
	Highlight4 *string `json:"highlight4_instance_id"`
	Highlight5 *string `json:"highlight5_instance_id"`
	Highlight6 *string `json:"highlight6_instance_id"`
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
			Success: false, Message: "Missing user_id in URL",
		})
	}

	if authID, _ := c.Locals("user_id").(string); authID != userID {
		return c.Status(fiber.StatusForbidden).JSON(UpdateUserResponse{
			Success: false, Message: "Not authorised for that user",
		})
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false, Message: "Invalid JSON payload",
		})
	}

	// basic username validation
	if len(req.Username) < 3 || len(req.Username) > 30 {
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false, Message: "Username must be 3-30 characters",
		})
	}

	// username clash?
	var clash User
	if err := db.Where("username = ? AND user_id <> ?", req.Username, userID).
		First(&clash).Error; err != nil && err != gorm.ErrRecordNotFound {
		return c.Status(500).JSON(UpdateUserResponse{Success: false, Message: "DB error"})
	}
	if clash.UserID != "" {
		return c.Status(fiber.StatusConflict).JSON(UpdateUserResponse{
			Success: false, Message: "Username already taken",
		})
	}

	// ---------- build update map ----------
	update := map[string]interface{}{
		"username": req.Username, // always present
	}

	if req.PokemonGoName != nil {
		update["pokemon_go_name"] = req.PokemonGoName
	}
	if req.Team != nil {
		update["team"] = req.Team
	}
	if req.TrainerLevel != nil {
		update["trainer_level"] = req.TrainerLevel
	}
	if req.TotalXP != nil {
		update["total_xp"] = req.TotalXP
	}
	if req.PogoStartedOn != nil && *req.PogoStartedOn != "" {
		if t, err := time.Parse(time.RFC3339, *req.PogoStartedOn); err == nil {
			update["pogo_started_on"] = &t
		}
	}

	// location bits
	if req.AllowLocation != nil {
		update["allow_location"] = *req.AllowLocation
	}
	if req.Location != nil {
		update["location"] = req.Location
	}
	if req.Latitude != nil {
		update["latitude"] = req.Latitude
	}
	if req.Longitude != nil {
		update["longitude"] = req.Longitude
	}

	// highlights
	if req.Highlight1 != nil {
		update["highlight1_instance_id"] = req.Highlight1
	}
	if req.Highlight2 != nil {
		update["highlight2_instance_id"] = req.Highlight2
	}
	if req.Highlight3 != nil {
		update["highlight3_instance_id"] = req.Highlight3
	}
	if req.Highlight4 != nil {
		update["highlight4_instance_id"] = req.Highlight4
	}
	if req.Highlight5 != nil {
		update["highlight5_instance_id"] = req.Highlight5
	}
	if req.Highlight6 != nil {
		update["highlight6_instance_id"] = req.Highlight6
	}

	// ---------- upsert ----------
	// try update; if no rows affected, insert
	res := db.Model(&User{}).Where("user_id = ?", userID).Updates(update)
	if res.Error != nil {
		logrus.Errorf("update user: %v", res.Error)
		return c.Status(500).JSON(UpdateUserResponse{Success: false, Message: "DB update failed"})
	}
	if res.RowsAffected == 0 {
		// create new row with the same map + PK
		update["user_id"] = userID
		if err := db.Table("users").Create(update).Error; err != nil {
			logrus.Errorf("insert user: %v", err)
			return c.Status(500).JSON(UpdateUserResponse{Success: false, Message: "DB insert failed"})
		}
	}

	// fetch fresh copy
	var saved User
	if err := db.First(&saved, "user_id = ?", userID).Error; err != nil {
		return c.Status(500).JSON(UpdateUserResponse{Success: false, Message: "Fetch failed"})
	}

	return c.JSON(UpdateUserResponse{
		Success: true, Message: "User updated", User: &saved,
	})
}
