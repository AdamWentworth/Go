// users_handlers.go

package main

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// UpdateUserRequest represents the expected request body for updating
// username, latitude, and longitude.
type UpdateUserRequest struct {
	Username  string  `json:"username"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// UpdateUserResponse represents the response after attempting to update the user
type UpdateUserResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	User    *User  `json:"user,omitempty"`
}

// UpdateUserHandler handles updating user details in the secondary database.
func UpdateUserHandler(c *fiber.Ctx) error {
	userID := c.Params("user_id")
	if userID == "" {
		logrus.Error("UpdateUserHandler: Missing user_id in URL parameters")
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Missing user_id in URL parameters",
		})
	}

	authenticatedUserID := c.Locals("user_id").(string)
	if authenticatedUserID != userID {
		logrus.Warnf("UpdateUserHandler: User %s attempted to update user %s",
			authenticatedUserID, userID)
		return c.Status(fiber.StatusForbidden).JSON(UpdateUserResponse{
			Success: false,
			Message: "You are not authorized to update this user's details",
		})
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		logrus.Errorf("UpdateUserHandler: Failed to parse request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Invalid request body",
		})
	}

	// Simple validation for username length
	if len(req.Username) < 3 || len(req.Username) > 30 {
		logrus.Warnf("UpdateUserHandler: Username length validation failed for user %s", userID)
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Username must be between 3 and 30 characters",
		})
	}

	// Check if the username already exists
	var existingUser User
	err := db.Where("username = ?", req.Username).First(&existingUser).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		logrus.Errorf("UpdateUserHandler: Database error while checking existing username: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUserResponse{
			Success: false,
			Message: "Internal server error",
		})
	}
	if existingUser.UserID != "" && existingUser.UserID != userID {
		logrus.Warnf("UpdateUserHandler: Username '%s' is already taken", req.Username)
		return c.Status(fiber.StatusConflict).JSON(UpdateUserResponse{
			Success: false,
			Message: "Username is already taken",
		})
	}

	updates := map[string]interface{}{
		"username":  req.Username,
		"latitude":  req.Latitude,
		"longitude": req.Longitude,
	}

	// ---------------------------
	//     ADDING RETRY LOGIC
	// ---------------------------
	const maxRetries = 3
	var result *gorm.DB
	var updateErr error

	for i := 1; i <= maxRetries; i++ {
		result = db.Model(&User{}).Where("user_id = ?", userID).Updates(updates)

		if result.Error == nil {
			// Update was successful; break out of the retry loop
			break
		}

		// Check if it's a transient error (like a bad connection)
		if !isTransientError(result.Error) {
			// Non-transient: no point in retrying
			updateErr = result.Error
			break
		}

		// It's a transient error; log and retry after a short sleep
		logrus.Warnf("UpdateUserHandler: Transient DB error on attempt %d/%d: %v. Retrying...", i, maxRetries, result.Error)
		time.Sleep(time.Duration(i) * time.Second) // simple linear backoff
	}

	// If we still have an error after retries, return
	if result.Error != nil {
		if updateErr == nil {
			updateErr = result.Error
		}
		logrus.Errorf("UpdateUserHandler: Failed to update user in secondary DB (after retries): %v", updateErr)
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUserResponse{
			Success: false,
			Message: "Failed to update user in secondary database",
		})
	}

	// Check if the update affected any rows
	if result.RowsAffected == 0 {
		logrus.Warnf("UpdateUserHandler: No user found with user_id %s", userID)
		return c.Status(fiber.StatusNotFound).JSON(UpdateUserResponse{
			Success: false,
			Message: "User not found",
		})
	}

	// Retrieve the updated user details
	var updatedUser User
	err = db.First(&updatedUser, "user_id = ?", userID).Error
	if err != nil {
		logrus.Errorf("UpdateUserHandler: Failed to retrieve updated user details: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUserResponse{
			Success: false,
			Message: "Failed to retrieve updated user details",
		})
	}

	logrus.Infof("UpdateUserHandler: User %s updated their username to '%s' and location to (%f, %f)",
		userID, req.Username, req.Latitude, req.Longitude)

	return c.Status(fiber.StatusOK).JSON(UpdateUserResponse{
		Success: true,
		Message: "User updated successfully",
		User:    &updatedUser,
	})
}
