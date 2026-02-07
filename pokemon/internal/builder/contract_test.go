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
