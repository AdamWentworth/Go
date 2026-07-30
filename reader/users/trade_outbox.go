package main

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

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
	payload := tradeEventPayload{
		Trade:             map[string]Trade{trade.TradeID: trade},
		RelatedInstance:   related,
		AffectedInstances: affectedByID,
	}
	return enqueueApplicationEvent(
		tx, c, "trade", trade.TradeID, "trade.updated",
		[]string{trade.UserIDProposed, trade.UserIDAccepting}, payload,
	)
}

func enqueueTradeEvent(
	tx *gorm.DB,
	c fiber.Ctx,
	trade Trade,
	instances ...PokemonInstance,
) error {
	return enqueueTradeEventWithAffected(tx, c, trade, instances, nil)
}
