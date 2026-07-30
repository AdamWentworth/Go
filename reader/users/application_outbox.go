package main

import (
	"encoding/json"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ApplicationOutbox struct {
	EventID          string     `gorm:"column:event_id;primaryKey"`
	AggregateType    string     `gorm:"column:aggregate_type"`
	AggregateID      string     `gorm:"column:aggregate_id"`
	EventType        string     `gorm:"column:event_type"`
	RecipientUserIDs string     `gorm:"column:recipient_user_ids"`
	SourceDeviceID   *string    `gorm:"column:source_device_id"`
	Payload          string     `gorm:"column:payload"`
	CreatedAt        time.Time  `gorm:"column:created_at"`
	ProcessedAt      *time.Time `gorm:"column:processed_at"`
	Attempts         uint       `gorm:"column:attempts"`
	NextAttemptAt    time.Time  `gorm:"column:next_attempt_at"`
	LastError        *string    `gorm:"column:last_error"`
}

func (ApplicationOutbox) TableName() string { return "application_outbox" }

func enqueueApplicationEvent(
	tx *gorm.DB,
	c fiber.Ctx,
	aggregateType string,
	aggregateID string,
	eventType string,
	recipients []string,
	payload any,
) error {
	rawPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	rawRecipients, err := json.Marshal(recipients)
	if err != nil {
		return err
	}
	var sourceDeviceID *string
	if value, ok := c.Locals("device_id").(string); ok && value != "" {
		sourceDeviceID = &value
	}
	now := time.Now().UTC()
	return tx.Create(&ApplicationOutbox{
		EventID:          uuid.NewString(),
		AggregateType:    aggregateType,
		AggregateID:      aggregateID,
		EventType:        eventType,
		RecipientUserIDs: string(rawRecipients),
		SourceDeviceID:   sourceDeviceID,
		Payload:          string(rawPayload),
		CreatedAt:        now,
		NextAttemptAt:    now,
	}).Error
}
