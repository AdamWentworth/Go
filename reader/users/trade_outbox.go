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

type tradeEventPayload struct {
	Trade             map[string]Trade           `json:"trade"`
	RelatedInstance   map[string]PokemonInstance `json:"relatedInstance"`
	AffectedInstances map[string]PokemonInstance `json:"affectedInstances,omitempty"`
}

func enqueueTradeEventWithAffected(
	tx *gorm.DB,
	c fiber.Ctx,
	trade Trade,
	instances []PokemonInstance,
	affected []PokemonInstance,
) error {
	related := make(map[string]PokemonInstance, len(instances))
	for _, instance := range instances {
		related[instance.InstanceID] = instance
	}
	affectedByID := make(map[string]PokemonInstance, len(affected))
	for _, instance := range affected {
		affectedByID[instance.InstanceID] = instance
	}
	payload, err := json.Marshal(tradeEventPayload{
		Trade:             map[string]Trade{trade.TradeID: trade},
		RelatedInstance:   related,
		AffectedInstances: affectedByID,
	})
	if err != nil {
		return err
	}
	recipients, err := json.Marshal([]string{trade.UserIDProposed, trade.UserIDAccepting})
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
		AggregateType:    "trade",
		AggregateID:      trade.TradeID,
		EventType:        "trade.updated",
		RecipientUserIDs: string(recipients),
		SourceDeviceID:   sourceDeviceID,
		Payload:          string(payload),
		CreatedAt:        now,
		NextAttemptAt:    now,
	}).Error
}

func enqueueTradeEvent(
	tx *gorm.DB,
	c fiber.Ctx,
	trade Trade,
	instances ...PokemonInstance,
) error {
	return enqueueTradeEventWithAffected(tx, c, trade, instances, nil)
}
