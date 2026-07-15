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
