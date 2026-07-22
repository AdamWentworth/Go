//go:build integration
// +build integration

package builder_test

import (
	"bytes"
	"context"
	"encoding/json"
	"testing"
	"time"

	"pokemon_data/internal/builder"
)

// The published catalog is now PostgreSQL-native. This guards the two useful
// invariants of the published catalog contract: a complete payload can be
// built from the migrated schema, and its JSON encoding is deterministic.
func TestPostgresPayloadContract(t *testing.T) {
	sqlDB := openIntegrationPostgres(t)
	defer sqlDB.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	b := builder.New(sqlDB, nil)
	first, err := b.BuildFullPokemonPayload(ctx)
	if err != nil {
		t.Fatalf("build first PostgreSQL payload: %v", err)
	}
	second, err := b.BuildFullPokemonPayload(ctx)
	if err != nil {
		t.Fatalf("build second PostgreSQL payload: %v", err)
	}

	firstJSON, err := json.Marshal(first)
	if err != nil {
		t.Fatalf("marshal first PostgreSQL payload: %v", err)
	}
	secondJSON, err := json.Marshal(second)
	if err != nil {
		t.Fatalf("marshal second PostgreSQL payload: %v", err)
	}
	if len(firstJSON) == 0 {
		t.Fatal("expected non-empty PostgreSQL payload")
	}
	if !bytes.Equal(firstJSON, secondJSON) {
		t.Fatal("PostgreSQL catalog payload changed between identical reads")
	}
}

func TestPostgresPayloadIncludesCanonicalGigantamaxMove(t *testing.T) {
	sqlDB := openIntegrationPostgres(t)
	defer sqlDB.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	payload, err := builder.New(sqlDB, nil).BuildFullPokemonPayload(ctx)
	if err != nil {
		t.Fatalf("build PostgreSQL payload: %v", err)
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal PostgreSQL payload: %v", err)
	}
	var entries []map[string]any
	if err := json.Unmarshal(raw, &entries); err != nil {
		t.Fatalf("decode PostgreSQL payload: %v", err)
	}

	for _, entry := range entries {
		if entry["pokemon_id"] != float64(3) {
			continue
		}
		maxForms, ok := entry["max"].([]any)
		if !ok || len(maxForms) != 1 {
			t.Fatalf("Venusaur max forms = %#v", entry["max"])
		}
		maxForm, ok := maxForms[0].(map[string]any)
		if !ok {
			t.Fatalf("Venusaur max form has unexpected shape: %#v", maxForms[0])
		}
		if maxForm["gigantamax_move_name"] != "G-Max Vine Lash" ||
			maxForm["gigantamax_move_type"] != "Grass" ||
			maxForm["gigantamax_move_type_id"] != float64(2) {
			t.Fatalf("unexpected Venusaur G-Max move payload: %#v", maxForm)
		}
		return
	}

	t.Fatal("Venusaur missing from PostgreSQL payload")
}

func TestPostgresPayloadIncludesMaxBattleProfiles(t *testing.T) {
	sqlDB := openIntegrationPostgres(t)
	defer sqlDB.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	payload, err := builder.New(sqlDB, nil).BuildCatalogPayload(ctx)
	if err != nil {
		t.Fatalf("build PostgreSQL catalog payload: %v", err)
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal PostgreSQL catalog payload: %v", err)
	}
	var entries []map[string]any
	if err := json.Unmarshal(raw, &entries); err != nil {
		t.Fatalf("decode PostgreSQL catalog payload: %v", err)
	}

	for _, entry := range entries {
		if entry["pokemon_id"] != float64(1) {
			continue
		}
		profiles, ok := entry["max_battle_profiles"].([]any)
		if !ok || len(profiles) != 2 {
			t.Fatalf("Bulbasaur Max Battle profiles = %#v", entry["max_battle_profiles"])
		}
		defaultProfile, ok := profiles[0].(map[string]any)
		if !ok {
			t.Fatalf("Bulbasaur profile has unexpected shape: %#v", profiles[0])
		}
		if defaultProfile["tier"] != "one-star" ||
			defaultProfile["boss_hp"] != float64(1700) ||
			defaultProfile["default_trainers"] != float64(1) ||
			defaultProfile["is_default"] != float64(1) {
			t.Fatalf("unexpected Bulbasaur Max Battle profile: %#v", defaultProfile)
		}
		return
	}

	t.Fatal("Bulbasaur missing from PostgreSQL catalog payload")
}
