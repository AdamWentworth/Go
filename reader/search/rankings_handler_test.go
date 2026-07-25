package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

func withRankingsLoader(
	t *testing.T,
	loader func(int) (pokemonRankingsResponse, error),
) {
	t.Helper()
	previous := loadPokemonRankingsFn
	loadPokemonRankingsFn = loader
	t.Cleanup(func() {
		loadPokemonRankingsFn = previous
	})
}

func rankingsTestApp() *fiber.App {
	app := fiber.New()
	app.Get("/api/rankings", PokemonRankings)
	return app
}

func TestPokemonRankingsReturnsSnapshotAndCacheValidators(t *testing.T) {
	updatedAt := time.Date(2026, time.July, 25, 12, 0, 0, 0, time.UTC)
	var receivedLimit int
	withRankingsLoader(t, func(limit int) (pokemonRankingsResponse, error) {
		receivedLimit = limit
		return pokemonRankingsResponse{
			Snapshot: pokemonRankingsSnapshot{
				CollectorUsers: 12,
				WishlistUsers:  9,
				UpdatedAt:      updatedAt,
			},
			MostWanted: []pokemonRankingRow{{
				VariantID:       "25-shiny",
				WantedUsers:     7,
				MostWantedUsers: 2,
				CaughtUsers:     4,
			}},
			Rarest: []pokemonRankingRow{{
				VariantID:   "150-costume",
				WantedUsers: 3,
				CaughtUsers: 1,
			}},
		}, nil
	})

	app := rankingsTestApp()
	response, err := app.Test(httptest.NewRequest(
		"GET",
		"/api/rankings?limit=25",
		nil,
	))
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer response.Body.Close()

	if response.StatusCode != fiber.StatusOK {
		t.Fatalf("status = %d, want %d", response.StatusCode, fiber.StatusOK)
	}
	if receivedLimit != 25 {
		t.Fatalf("loader limit = %d, want 25", receivedLimit)
	}
	if got := response.Header.Get("Cache-Control"); got != "private, max-age=60" {
		t.Fatalf("Cache-Control = %q", got)
	}
	if response.Header.Get("ETag") == "" {
		t.Fatal("ETag is empty")
	}

	var payload pokemonRankingsResponse
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(payload.MostWanted) != 1 || payload.MostWanted[0].VariantID != "25-shiny" {
		t.Fatalf("unexpected most wanted payload: %#v", payload.MostWanted)
	}
	if payload.Snapshot.CollectorUsers != 12 {
		t.Fatalf("collector users = %d, want 12", payload.Snapshot.CollectorUsers)
	}
}

func TestPokemonRankingsHonorsMatchingETag(t *testing.T) {
	updatedAt := time.Date(2026, time.July, 25, 12, 0, 0, 0, time.UTC)
	withRankingsLoader(t, func(int) (pokemonRankingsResponse, error) {
		return pokemonRankingsResponse{
			Snapshot: pokemonRankingsSnapshot{
				CollectorUsers: 4,
				WishlistUsers:  3,
				UpdatedAt:      updatedAt,
			},
		}, nil
	})

	app := rankingsTestApp()
	first, err := app.Test(httptest.NewRequest("GET", "/api/rankings", nil))
	if err != nil {
		t.Fatalf("first app.Test: %v", err)
	}
	etag := first.Header.Get("ETag")
	first.Body.Close()

	request := httptest.NewRequest("GET", "/api/rankings", nil)
	request.Header.Set("If-None-Match", etag)
	response, err := app.Test(request)
	if err != nil {
		t.Fatalf("second app.Test: %v", err)
	}
	defer response.Body.Close()

	if response.StatusCode != fiber.StatusNotModified {
		body, _ := io.ReadAll(response.Body)
		t.Fatalf("status = %d, want 304; body=%s", response.StatusCode, body)
	}
}

func TestPokemonRankingsRejectsInvalidLimit(t *testing.T) {
	app := rankingsTestApp()
	for _, target := range []string{
		"/api/rankings?limit=0",
		"/api/rankings?limit=101",
		"/api/rankings?limit=nope",
	} {
		response, err := app.Test(httptest.NewRequest("GET", target, nil))
		if err != nil {
			t.Fatalf("app.Test(%s): %v", target, err)
		}
		response.Body.Close()
		if response.StatusCode != fiber.StatusBadRequest {
			t.Fatalf("%s status = %d, want 400", target, response.StatusCode)
		}
	}
}

func TestPokemonRankingsReportsMissingSnapshot(t *testing.T) {
	withRankingsLoader(t, func(int) (pokemonRankingsResponse, error) {
		return pokemonRankingsResponse{}, gorm.ErrRecordNotFound
	})

	response, err := rankingsTestApp().Test(
		httptest.NewRequest("GET", "/api/rankings", nil),
	)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != fiber.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", response.StatusCode)
	}
}

func TestPokemonRankingsPropagatesUnexpectedLoaderFailure(t *testing.T) {
	withRankingsLoader(t, func(int) (pokemonRankingsResponse, error) {
		return pokemonRankingsResponse{}, errors.New("database offline")
	})

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})
	app.Get("/api/rankings", PokemonRankings)
	response, err := app.Test(httptest.NewRequest("GET", "/api/rankings", nil))
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != fiber.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", response.StatusCode)
	}
}
