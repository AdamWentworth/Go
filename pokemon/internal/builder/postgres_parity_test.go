package builder_test

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	"pokemon_data/internal/builder"
	"pokemon_data/internal/db"
)

// TestPostgresPayloadParity proves that a migrated PostgreSQL catalog produces
// exactly the same browser payload bytes as the known-good SQLite catalog.
// The test is intentionally opt-in so normal unit runs never require a local
// Postgres instance. scripts/test-postgres-catalog-parity.sh and CI supply the
// required ephemeral database URL.
func TestPostgresPayloadParity(t *testing.T) {
	postgresURL := os.Getenv("POSTGRES_TEST_URL")
	if postgresURL == "" {
		t.Skip("POSTGRES_TEST_URL is not set")
	}

	sqlitePath := resolveParitySQLitePath(t)
	sqliteDB, err := db.OpenSQLite(sqlitePath)
	if err != nil {
		t.Fatalf("open SQLite catalog: %v", err)
	}
	defer sqliteDB.Close()

	postgresDB, err := db.OpenPostgres(postgresURL)
	if err != nil {
		t.Fatalf("open PostgreSQL catalog: %v", err)
	}
	defer postgresDB.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	sqlitePayload, err := builder.New(sqliteDB, nil).BuildFullPokemonPayload(ctx)
	if err != nil {
		t.Fatalf("build SQLite payload: %v", err)
	}
	postgresPayload, err := builder.NewWithDialect(postgresDB, builder.DialectPostgres, nil).BuildFullPokemonPayload(ctx)
	if err != nil {
		t.Fatalf("build PostgreSQL payload: %v", err)
	}

	sqliteJSON, err := json.Marshal(sqlitePayload)
	if err != nil {
		t.Fatalf("marshal SQLite payload: %v", err)
	}
	postgresJSON, err := json.Marshal(postgresPayload)
	if err != nil {
		t.Fatalf("marshal PostgreSQL payload: %v", err)
	}
	if !bytes.Equal(sqliteJSON, postgresJSON) {
		t.Fatalf("PostgreSQL payload differs from SQLite: sqlite=%d bytes postgres=%d bytes\n%s", len(sqliteJSON), len(postgresJSON), firstJSONDifference(sqliteJSON, postgresJSON))
	}
}

func resolveParitySQLitePath(t *testing.T) string {
	t.Helper()
	if path := os.Getenv("SQLITE_PATH"); path != "" {
		return path
	}

	for _, path := range []string{
		"./data/pokego.db",
		filepath.Join("..", "..", "data", "pokego.db"),
	} {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	t.Fatal("could not find SQLite catalog; set SQLITE_PATH")
	return ""
}

func firstJSONDifference(left, right []byte) string {
	limit := len(left)
	if len(right) < limit {
		limit = len(right)
	}
	for index := 0; index < limit; index++ {
		if left[index] != right[index] {
			start := index - 120
			if start < 0 {
				start = 0
			}
			endLeft := index + 240
			if endLeft > len(left) {
				endLeft = len(left)
			}
			endRight := index + 240
			if endRight > len(right) {
				endRight = len(right)
			}
			return "first byte mismatch at " + strconv.Itoa(index) + "\nsqlite: " + string(left[start:endLeft]) + "\npostgres: " + string(right[start:endRight])
		}
	}
	return "payloads share a prefix but have different lengths"
}
