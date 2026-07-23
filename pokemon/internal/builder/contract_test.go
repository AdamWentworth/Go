//go:build integration
// +build integration

package builder_test

import (
	"context"
	"database/sql"
	"encoding/json"
	"os"
	"testing"
	"time"

	"pokemon_data/internal/builder"
	"pokemon_data/internal/db"
)

// Integration contract test: /pokemon/pokemons payload must have a stable shape so clients do not need
// "if key exists" logic for optional fields.
//
// Run with:
//
//	go test -tags=integration ./...
func TestPokemonPayload_StableShape(t *testing.T) {
	_, arr := buildIntegrationPayload(t)
	assertStableShape(t, arr)
}

func TestPokemonPayloadChunks_KeepCatalogLeanAndAddressable(t *testing.T) {
	sqlDB := openIntegrationPostgres(t)
	defer sqlDB.Close()

	b := builder.New(sqlDB, nil)
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	fullPayload, err := b.BuildFullPokemonPayload(ctx)
	if err != nil {
		t.Fatalf("BuildFullPokemonPayload: %v", err)
	}
	catalogPayload, err := b.BuildCatalogPayload(ctx)
	if err != nil {
		t.Fatalf("BuildCatalogPayload: %v", err)
	}
	movesPayload, err := b.BuildMovesPayload(ctx)
	if err != nil {
		t.Fatalf("BuildMovesPayload: %v", err)
	}
	raidPayload, err := b.BuildRaidDataPayload(ctx)
	if err != nil {
		t.Fatalf("BuildRaidDataPayload: %v", err)
	}
	maxPayload, err := b.BuildMaxBattlePayload(ctx)
	if err != nil {
		t.Fatalf("BuildMaxBattlePayload: %v", err)
	}
	pvpPayload, err := b.BuildPvPRankingsPayload(ctx)
	if err != nil {
		t.Fatalf("BuildPvPRankingsPayload: %v", err)
	}

	decode := func(label string, payload any) []map[string]any {
		t.Helper()
		raw, err := json.Marshal(payload)
		if err != nil {
			t.Fatalf("marshal %s: %v", label, err)
		}
		var entries []map[string]any
		if err := json.Unmarshal(raw, &entries); err != nil {
			t.Fatalf("decode %s: %v", label, err)
		}
		return entries
	}

	full := decode("full", fullPayload)
	catalog := decode("catalog", catalogPayload)
	moves := decode("moves", movesPayload)
	raids := decode("raid data", raidPayload)
	maxEntries := decode("max data", maxPayload)

	pvpRaw, err := json.Marshal(pvpPayload)
	if err != nil {
		t.Fatalf("marshal PvP data: %v", err)
	}
	var pvp struct {
		Source *struct {
			Name string `json:"name"`
		} `json:"source"`
		Leagues map[string]struct {
			Entries []map[string]any `json:"entries"`
		} `json:"leagues"`
	}
	if err := json.Unmarshal(pvpRaw, &pvp); err != nil {
		t.Fatalf("decode PvP data: %v", err)
	}
	if pvp.Source == nil || pvp.Source.Name != "PvPoke" {
		t.Fatalf("PvP snapshot source missing: %#v", pvp.Source)
	}
	for _, league := range []string{"great", "ultra", "master"} {
		if len(pvp.Leagues[league].Entries) == 0 {
			t.Fatalf("%s PvP league has no fixture entries", league)
		}
	}

	if len(full) == 0 || len(catalog) != len(full) || len(moves) != len(full) || len(raids) != len(full) {
		t.Fatalf("chunk lengths full=%d catalog=%d moves=%d raids=%d", len(full), len(catalog), len(moves), len(raids))
	}
	if len(maxEntries) == 0 || len(maxEntries) >= len(full) {
		t.Fatalf("max chunk should be a non-empty subset: max=%d full=%d", len(maxEntries), len(full))
	}

	for _, entry := range catalog {
		if _, ok := entry["pokemon_id"]; !ok {
			t.Fatalf("catalog entry missing pokemon_id: %#v", entry)
		}
		if values, ok := entry["moves"].([]any); !ok || len(values) != 0 {
			t.Fatalf("catalog must omit move data, got %#v", entry["moves"])
		}
		if values, ok := entry["raid_boss"].([]any); !ok || len(values) != 0 {
			t.Fatalf("catalog must omit raid history, got %#v", entry["raid_boss"])
		}
	}

	for _, entry := range moves {
		if _, ok := entry["pokemon_id"]; !ok {
			t.Fatalf("moves entry missing pokemon_id: %#v", entry)
		}
		if _, ok := entry["moves"].([]any); !ok {
			t.Fatalf("moves entry missing moves array: %#v", entry)
		}
	}

	for _, entry := range raids {
		if _, ok := entry["pokemon_id"]; !ok {
			t.Fatalf("raid entry missing pokemon_id: %#v", entry)
		}
		if _, ok := entry["raid_boss"].([]any); !ok {
			t.Fatalf("raid entry missing raid_boss array: %#v", entry)
		}
	}

	for _, entry := range maxEntries {
		pokemonID := int(entry["pokemon_id"].(float64))
		maxForms, _ := entry["max"].([]any)
		if len(maxForms) == 0 && pokemonID != 888 && pokemonID != 889 && pokemonID != 890 {
			t.Fatalf("max chunk contains ineligible Pokemon %d", pokemonID)
		}
		if movePool, ok := entry["moves"].([]any); !ok || len(movePool) == 0 {
			t.Fatalf("max chunk Pokemon %d must retain move data", pokemonID)
		}
	}
}

func buildIntegrationPayload(t *testing.T) ([]byte, []map[string]any) {
	t.Helper()

	sqlDB := openIntegrationPostgres(t)
	defer sqlDB.Close()

	b := builder.New(sqlDB, nil)

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	payload, err := b.BuildFullPokemonPayload(ctx)
	if err != nil {
		t.Fatalf("BuildFullPokemonPayload: %v", err)
	}

	// Normalize by encoding/decoding JSON so we validate what clients actually receive.
	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("json marshal: %v", err)
	}

	var arr []map[string]any
	if err := json.Unmarshal(raw, &arr); err != nil {
		t.Fatalf("json unmarshal (expected array of objects): %v", err)
	}
	if len(arr) == 0 {
		t.Fatalf("expected non-empty pokemon array")
	}
	return raw, arr
}

func openIntegrationPostgres(t *testing.T) *sql.DB {
	t.Helper()
	databaseURL := os.Getenv("POSTGRES_TEST_URL")
	if databaseURL == "" {
		t.Skip("POSTGRES_TEST_URL is not configured")
	}
	sqlDB, err := db.OpenPostgres(databaseURL)
	if err != nil {
		t.Fatalf("open PostgreSQL catalog: %v", err)
	}
	return sqlDB
}
