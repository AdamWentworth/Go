package main

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

const (
	defaultRankingsLimit     = 50
	maxRankingsLimit         = 10000
	rankingsPrivacyThreshold = 5
	rankingsResponseVersion  = 2
)

type pokemonRankingRow struct {
	VariantID       string `gorm:"column:variant_id" json:"variant_id"`
	WantedUsers     uint64 `gorm:"column:wanted_user_count" json:"wanted_users"`
	MostWantedUsers uint64 `gorm:"column:most_wanted_user_count" json:"most_wanted_users"`
	CaughtUsers     uint64 `gorm:"column:caught_user_count" json:"caught_users"`
}

type pokemonRankingsSnapshot struct {
	CollectorUsers uint64    `gorm:"column:collector_user_count" json:"collector_users"`
	WishlistUsers  uint64    `gorm:"column:wishlist_user_count" json:"wishlist_users"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
}

type pokemonRankingsResponse struct {
	Snapshot   pokemonRankingsSnapshot `json:"snapshot"`
	MostWanted []pokemonRankingRow     `json:"most_wanted"`
	Rarest     []pokemonRankingRow     `json:"rarest"`
}

type publicPokemonRankingRow struct {
	VariantID       string  `json:"variant_id"`
	WantedUsers     *uint64 `json:"wanted_users"`
	MostWantedUsers *uint64 `json:"most_wanted_users"`
	CaughtUsers     uint64  `json:"caught_users"`
}

type publicPokemonRankingsResponse struct {
	Snapshot         pokemonRankingsSnapshot   `json:"snapshot"`
	PrivacyThreshold uint64                    `json:"privacy_threshold"`
	MostWanted       []publicPokemonRankingRow `json:"most_wanted"`
	Rarest           []publicPokemonRankingRow `json:"rarest"`
}

var loadPokemonRankingsFn = loadPokemonRankings

func publicRankingCount(count uint64) *uint64 {
	if count == 0 {
		value := count
		return &value
	}
	if count < rankingsPrivacyThreshold {
		return nil
	}
	value := count
	return &value
}

func publicRankingRows(rows []pokemonRankingRow) []publicPokemonRankingRow {
	publicRows := make([]publicPokemonRankingRow, 0, len(rows))
	for _, row := range rows {
		publicRows = append(publicRows, publicPokemonRankingRow{
			VariantID:       row.VariantID,
			WantedUsers:     publicRankingCount(row.WantedUsers),
			MostWantedUsers: publicRankingCount(row.MostWantedUsers),
			CaughtUsers:     row.CaughtUsers,
		})
	}
	return publicRows
}

func loadPokemonRankings(limit int) (pokemonRankingsResponse, error) {
	var response pokemonRankingsResponse
	if err := db.
		Table("pokemon_rankings_snapshot").
		Select("collector_user_count, wishlist_user_count, updated_at").
		Where("snapshot_key = 1").
		Take(&response.Snapshot).
		Error; err != nil {
		return response, err
	}

	if err := db.
		Table("pokemon_variant_rankings").
		Select("variant_id, wanted_user_count, most_wanted_user_count, caught_user_count").
		Order("wanted_user_count DESC").
		Order("most_wanted_user_count DESC").
		Order("caught_user_count ASC").
		Order("variant_id ASC").
		Limit(limit).
		Find(&response.MostWanted).
		Error; err != nil {
		return response, err
	}
	if err := db.
		Table("pokemon_variant_rankings").
		Select("variant_id, wanted_user_count, most_wanted_user_count, caught_user_count").
		Where("caught_user_count > 0").
		Order("caught_user_count ASC").
		Order("wanted_user_count DESC").
		Order("variant_id ASC").
		Limit(limit).
		Find(&response.Rarest).
		Error; err != nil {
		return response, err
	}
	return response, nil
}

func PokemonRankings(c fiber.Ctx) error {
	limit := defaultRankingsLimit
	if rawLimit := c.Query("limit"); rawLimit != "" {
		parsed, err := strconv.Atoi(rawLimit)
		if err != nil || parsed < 1 || parsed > maxRankingsLimit {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("limit must be between 1 and %d", maxRankingsLimit),
			})
		}
		limit = parsed
	}

	response, err := loadPokemonRankingsFn(limit)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "Pokemon rankings snapshot is not available yet",
			})
		}
		return err
	}

	etag := fmt.Sprintf(
		`W/"rankings-v%d-%d-%d-%d-%d"`,
		rankingsResponseVersion,
		response.Snapshot.UpdatedAt.UnixMilli(),
		response.Snapshot.CollectorUsers,
		response.Snapshot.WishlistUsers,
		limit,
	)
	c.Set("ETag", etag)
	c.Set("Cache-Control", "public, max-age=30, stale-while-revalidate=30")
	if c.Get("If-None-Match") == etag {
		return c.Status(fiber.StatusNotModified).Send(nil)
	}
	return c.JSON(publicPokemonRankingsResponse{
		Snapshot:         response.Snapshot,
		PrivacyThreshold: rankingsPrivacyThreshold,
		MostWanted:       publicRankingRows(response.MostWanted),
		Rarest:           publicRankingRows(response.Rarest),
	})
}
