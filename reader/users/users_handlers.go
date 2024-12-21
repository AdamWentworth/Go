// users_handlers.go

package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// UpdateUsernameRequest represents the expected request body for updating the username
type UpdateUsernameRequest struct {
	Username string `json:"username"`
}

// UpdateUsernameResponse represents the response after attempting to update the username
type UpdateUsernameResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	User    *User  `json:"user,omitempty"`
}

// UpdateUsernameHandler handles the updating of a user's username in the secondary database
func UpdateUsernameHandler(c *fiber.Ctx) error {
	// Retrieve the user_id from the URL parameter
	userID := c.Params("user_id")
	if userID == "" {
		logrus.Error("UpdateUsernameHandler: Missing user_id in URL parameters")
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "Missing user_id in URL parameters",
		})
	}

	// Retrieve the authenticated user's ID from the JWT middleware
	authenticatedUserID := c.Locals("user_id").(string)
	if authenticatedUserID != userID {
		logrus.Warnf("UpdateUsernameHandler: User %s attempted to update username for user %s", authenticatedUserID, userID)
		return c.Status(fiber.StatusForbidden).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "You are not authorized to update this user's details",
		})
	}

	// Parse and validate the request body
	var req UpdateUsernameRequest
	if err := c.BodyParser(&req); err != nil {
		logrus.Errorf("UpdateUsernameHandler: Failed to parse request body: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "Invalid request body",
		})
	}

	// Validate the new username
	req.Username = fiber.Map{
		"username": req.Username,
	}["username"].(string) // Ensure it's a string

	if len(req.Username) < 3 || len(req.Username) > 30 {
		logrus.Warnf("UpdateUsernameHandler: Username length validation failed for user %s", userID)
		return c.Status(fiber.StatusBadRequest).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "Username must be between 3 and 30 characters",
		})
	}

	// Additional validation can be added here (e.g., regex for allowed characters)

	// Check if the new username is already taken in the secondary database
	var existingUser User
	err := db.Where("username = ?", req.Username).First(&existingUser).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		logrus.Errorf("UpdateUsernameHandler: Database error while checking existing username: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "Internal server error",
		})
	}

	if existingUser.UserID != "" {
		logrus.Warnf("UpdateUsernameHandler: Username '%s' is already taken", req.Username)
		return c.Status(fiber.StatusConflict).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "Username is already taken",
		})
	}

	// Update the username in the secondary database
	result := db.Model(&User{}).Where("user_id = ?", userID).Update("username", req.Username)
	if result.Error != nil {
		logrus.Errorf("UpdateUsernameHandler: Failed to update username in secondary DB: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "Failed to update username in secondary database",
		})
	}

	if result.RowsAffected == 0 {
		logrus.Warnf("UpdateUsernameHandler: No user found with user_id %s", userID)
		return c.Status(fiber.StatusNotFound).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "User not found",
		})
	}

	// Retrieve the updated user details
	var updatedUser User
	err = db.First(&updatedUser, "user_id = ?", userID).Error
	if err != nil {
		logrus.Errorf("UpdateUsernameHandler: Failed to retrieve updated user details: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(UpdateUsernameResponse{
			Success: false,
			Message: "Failed to retrieve updated user details",
		})
	}

	logrus.Infof("UpdateUsernameHandler: User %s updated their username to '%s'", userID, req.Username)

	// Respond with the updated user details
	return c.Status(fiber.StatusOK).JSON(UpdateUsernameResponse{
		Success: true,
		Message: "Username updated successfully",
		User:    &updatedUser,
	})
}
