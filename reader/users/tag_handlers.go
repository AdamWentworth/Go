package main

import (
	"errors"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const maxCustomTagsPerUser = 50

var customTagColorPattern = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)

var reservedTagNames = map[string]struct{}{
	"caught": {}, "favorite": {}, "favorites": {}, "trade": {},
	"for trade": {}, "wanted": {}, "most wanted": {}, "missing": {},
}

type tagMutationRequest struct {
	Parent string  `json:"parent"`
	Name   *string `json:"name"`
	Color  *string `json:"color"`
}

func normalizeTagName(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func validateTagName(value string) (string, string) {
	name := normalizeTagName(value)
	if len(name) < 1 || len([]rune(name)) > 40 {
		return "", "Tag names must be between 1 and 40 characters."
	}
	if _, reserved := reservedTagNames[strings.ToLower(name)]; reserved {
		return "", "That name is reserved for a built-in tag."
	}
	return name, ""
}

func validateTagColor(value string) (string, string) {
	color := strings.ToUpper(strings.TrimSpace(value))
	if !customTagColorPattern.MatchString(color) {
		return "", "Choose a valid six-digit tag color."
	}
	return color, ""
}

func validCustomTagParent(parent string) bool {
	return parent == "caught" || parent == "wanted"
}

func isBuiltInTag(tag PokemonTag) bool {
	name := strings.ToLower(normalizeTagName(tag.Name))
	switch tag.Parent {
	case "caught":
		return name == "favorite"
	case "trade":
		return name == "for trade"
	case "wanted":
		return name == "wanted" || name == "most wanted"
	default:
		return false
	}
}

func activeOwnedTag(userID, tagID string) (PokemonTag, error) {
	var tag PokemonTag
	err := db.Where("tag_id = ? AND user_id = ? AND deleted_at IS NULL", tagID, userID).First(&tag).Error
	return tag, err
}

func customTagNameExists(userID, parent, name, excludingTagID string) (bool, error) {
	query := db.Model(&PokemonTag{}).
		Where("user_id = ? AND parent = ? AND LOWER(name) = ? AND deleted_at IS NULL", userID, parent, strings.ToLower(name))
	if excludingTagID != "" {
		query = query.Where("tag_id <> ?", excludingTagID)
	}
	var count int64
	err := query.Count(&count).Error
	return count > 0, err
}

func GetTagsHandler(c fiber.Ctx) error {
	userID := viewerID(c)
	var tags []PokemonTag
	if err := db.
		Where("user_id = ? AND parent IN ? AND deleted_at IS NULL", userID, []string{"caught", "wanted"}).
		Order("parent ASC, sort ASC, LOWER(name) ASC").
		Find(&tags).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not load your tags."})
	}

	custom := make([]PokemonTag, 0, len(tags))
	for _, tag := range tags {
		if !isBuiltInTag(tag) {
			custom = append(custom, tag)
		}
	}
	return c.JSON(fiber.Map{"tags": custom})
}

func CreateTagHandler(c fiber.Ctx) error {
	userID := viewerID(c)
	var request tagMutationRequest
	if err := c.Bind().Body(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Enter a name and color for this tag."})
	}
	request.Parent = strings.ToLower(strings.TrimSpace(request.Parent))
	if !validCustomTagParent(request.Parent) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Custom tags must belong to Inventory or Wanted."})
	}
	if request.Name == nil || request.Color == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Enter a name and color for this tag."})
	}
	name, message := validateTagName(*request.Name)
	if message != "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": message})
	}
	color, message := validateTagColor(*request.Color)
	if message != "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": message})
	}

	var existingTags []PokemonTag
	if err := db.Select("parent", "name").
		Where("user_id = ? AND parent IN ? AND deleted_at IS NULL", userID, []string{"caught", "wanted"}).
		Find(&existingTags).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not create this tag."})
	}
	customCount := 0
	for _, existing := range existingTags {
		if !isBuiltInTag(existing) {
			customCount++
		}
	}
	if customCount >= maxCustomTagsPerUser {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"message": "You have reached the limit of 50 custom tags."})
	}
	exists, err := customTagNameExists(userID, request.Parent, name, "")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not create this tag."})
	}
	if exists {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"message": "A tag with that name already exists in this section."})
	}

	var maxSort int
	if err := db.Model(&PokemonTag{}).Where("user_id = ? AND parent = ? AND deleted_at IS NULL", userID, request.Parent).
		Select("COALESCE(MAX(sort), 0)").Scan(&maxSort).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not create this tag."})
	}
	now := time.Now().UTC()
	tag := PokemonTag{
		TagID: uuid.NewString(), UserID: userID, Parent: request.Parent,
		Name: name, Color: color, Sort: maxSort + 10, CreatedAt: now, UpdatedAt: &now,
	}
	if err := db.Create(&tag).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not create this tag."})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"tag": tag})
}

func UpdateTagHandler(c fiber.Ctx) error {
	userID := viewerID(c)
	tag, err := activeOwnedTag(userID, strings.TrimSpace(c.Params("tag_id")))
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Tag not found."})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not update this tag."})
	}
	if isBuiltInTag(tag) || !validCustomTagParent(tag.Parent) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": "Built-in tags cannot be changed."})
	}

	var request tagMutationRequest
	if err := c.Bind().Body(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Enter valid tag changes."})
	}
	updates := map[string]interface{}{}
	if request.Name != nil {
		name, message := validateTagName(*request.Name)
		if message != "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": message})
		}
		exists, lookupErr := customTagNameExists(userID, tag.Parent, name, tag.TagID)
		if lookupErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not update this tag."})
		}
		if exists {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"message": "A tag with that name already exists in this section."})
		}
		updates["name"] = name
	}
	if request.Color != nil {
		color, message := validateTagColor(*request.Color)
		if message != "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": message})
		}
		updates["color"] = color
	}
	if len(updates) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "No tag changes were provided."})
	}
	now := time.Now().UTC()
	updates["updated_at"] = now
	if err := db.Model(&PokemonTag{}).Where("tag_id = ? AND user_id = ?", tag.TagID, userID).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not update this tag."})
	}
	if err := db.Where("tag_id = ? AND user_id = ?", tag.TagID, userID).First(&tag).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "This tag changed, but could not be reloaded."})
	}
	return c.JSON(fiber.Map{"tag": tag})
}

func DeleteTagHandler(c fiber.Ctx) error {
	userID := viewerID(c)
	tag, err := activeOwnedTag(userID, strings.TrimSpace(c.Params("tag_id")))
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "Tag not found."})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not delete this tag."})
	}
	if isBuiltInTag(tag) || !validCustomTagParent(tag.Parent) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"message": "Built-in tags cannot be deleted."})
	}

	affected := []string{}
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&PokemonInstanceTag{}).
			Where("tag_id = ? AND user_id = ?", tag.TagID, userID).
			Pluck("instance_id", &affected).Error; err != nil {
			return err
		}
		now := time.Now().UTC()
		if err := tx.Model(&PokemonTag{}).
			Where("tag_id = ? AND user_id = ? AND deleted_at IS NULL", tag.TagID, userID).
			Updates(map[string]interface{}{"deleted_at": now, "updated_at": now}).Error; err != nil {
			return err
		}
		return tx.Where("tag_id = ? AND user_id = ?", tag.TagID, userID).Delete(&PokemonInstanceTag{}).Error
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"message": "Could not delete this tag."})
	}
	sort.Strings(affected)
	return c.JSON(fiber.Map{"tag_id": tag.TagID, "affected_instance_ids": affected})
}
