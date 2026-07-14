//go:build integration
// +build integration

package builder_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
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
	sqlitePath := resolveIntegrationSQLitePath()
	if _, err := os.Stat(sqlitePath); err != nil {
		t.Skipf("sqlite db not found at %s (skipping integration contract test): %v", sqlitePath, err)
	}

	sqlDB, err := db.OpenSQLite(sqlitePath)
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
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

	if len(full) == 0 || len(catalog) != len(full) || len(moves) != len(full) || len(raids) != len(full) {
		t.Fatalf("chunk lengths full=%d catalog=%d moves=%d raids=%d", len(full), len(catalog), len(moves), len(raids))
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
}

func buildIntegrationPayload(t *testing.T) ([]byte, []map[string]any) {
	t.Helper()

	sqlitePath := resolveIntegrationSQLitePath()
	if _, err := os.Stat(sqlitePath); err != nil {
		t.Skipf("sqlite db not found at %s (skipping integration contract test): %v", sqlitePath, err)
	}

	sqlDB, err := db.OpenSQLite(sqlitePath)
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
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

func resolveIntegrationSQLitePath() string {
	if p := strings.TrimSpace(os.Getenv("SQLITE_PATH")); p != "" {
		return p
	}

	candidates := []string{
		"./data/pokego.db",
		filepath.Join("..", "..", "data", "pokego.db"),
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return candidates[len(candidates)-1]
}
