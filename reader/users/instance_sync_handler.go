package main

import (
	"crypto/sha256"
	"encoding/hex"
	"sort"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/sirupsen/logrus"
)

func instanceSyncCheckpoint(instances []PokemonInstance) string {
	sort.Slice(instances, func(i, j int) bool {
		return instances[i].InstanceID < instances[j].InstanceID
	})
	hash := sha256.New()
	for _, instance := range instances {
		_, _ = hash.Write([]byte(instance.InstanceID))
		_, _ = hash.Write([]byte{0})
		_, _ = hash.Write([]byte(instance.UserID))
		_, _ = hash.Write([]byte{0})
		_, _ = hash.Write([]byte(strconv.FormatInt(instance.LastUpdate, 10)))
		_, _ = hash.Write([]byte{0})
	}
	return hex.EncodeToString(hash.Sum(nil))
}

// GetOwnInstanceSyncHandler returns an opaque server checkpoint and only sends
// the full canonical snapshot when the caller's checkpoint no longer matches.
// A full changed snapshot intentionally carries deletion information by absence.
func GetOwnInstanceSyncHandler(c fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var instances []PokemonInstance
	if err := db.Where("user_id = ?", userID).Find(&instances).Error; err != nil {
		logrus.Errorf("Failed to reconcile instances for user %s: %v", userID, err)
		return c.Status(fiber.StatusInternalServerError).
			JSON(fiber.Map{"error": "Failed to retrieve instances"})
	}

	checkpoint := instanceSyncCheckpoint(instances)
	if c.Query("checkpoint") == checkpoint {
		return c.JSON(fiber.Map{
			"checkpoint":   checkpoint,
			"not_modified": true,
		})
	}

	snapshot := make(map[string]interface{}, len(instances))
	for _, instance := range instances {
		item := instanceToMap(instance)
		item["instance_id"] = instance.InstanceID
		item["user_id"] = instance.UserID
		snapshot[instance.InstanceID] = item
	}
	return c.JSON(fiber.Map{
		"checkpoint":   checkpoint,
		"not_modified": false,
		"instances":    snapshot,
	})
}
