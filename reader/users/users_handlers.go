// users_handlers.go

package main

import (
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
// This replaces the old "UpdateUsernameHandler" and now supports
// username, latitude, and longitude.
func UpdateUserHandler(c *fiber.Ctx) error {
	// Retrieve the user_id from the URL parameter
	userID := c.Params("user_id")
	if userID == "" {
		logrus.Error("UpdateUserHandler: Missing user_id in URL parameters")
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Missing user_id in URL parameters",
		})
	}

	// Retrieve the authenticated user's ID from the JWT middleware
	authenticatedUserID := c.Locals("user_id").(string)
	if authenticatedUserID != userID {
		logrus.Warnf("UpdateUserHandler: User %s attempted to update user %s",
			authenticatedUserID, userID)
		return c.Status(fiber.StatusForbidden).JSON(UpdateUserResponse{
			Success: false,
			Message: "You are not authorized to update this user's details",
		})
	}

	// Parse the request body
	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		logrus.Errorf("UpdateUserHandler: Failed to parse request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Invalid request body",
		})
	}

	// --- EXAMPLE VALIDATIONS ---

	// Validate the new username
	// (If you do not care about username validation, you can remove this)
	if len(req.Username) < 3 || len(req.Username) > 30 {
		logrus.Warnf("UpdateUserHandler: Username length validation failed for user %s", userID)
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUserResponse{
			Success: false,
			Message: "Username must be between 3 and 30 characters",
		})
	}

	// Check if the new username is already taken in the secondary database
	// (If you do not need unique usernames in your secondary DB, remove this)
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

	// Prepare the map of fields to update
	updates := map[string]interface{}{
		"username":  req.Username,
		"latitude":  req.Latitude,
		"longitude": req.Longitude,
	}

	// Update the user in the secondary database
	result := db.Model(&User{}).
		Where("user_id = ?", userID).
		Updates(updates)

	if result.Error != nil {
		logrus.Errorf("UpdateUserHandler: Failed to update user in secondary DB: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUserResponse{
			Success: false,
			Message: "Failed to update user in secondary database",
		})
	}

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

	// Respond with the updated user details
	return c.Status(fiber.StatusOK).JSON(UpdateUserResponse{
		Success: true,
		Message: "User updated successfully",
		User:    &updatedUser,
	})
}
