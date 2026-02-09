package main

import (
	"bytes"
	"compress/gzip"
	"database/sql"
	"regexp"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func setupMockGormDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock, *sql.DB) {
	t.Helper()

	sqlDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	gdb, err := gorm.Open(mysql.New(mysql.Config{
		Conn:                      sqlDB,
		SkipInitializeWithVersion: true,
	}), &gorm.Config{})
	if err != nil {
		sqlDB.Close()
		t.Fatalf("failed to open gorm db: %v", err)
	}

	return gdb, mock, sqlDB
}

func gzipBytes(t *testing.T, payload []byte) []byte {
	t.Helper()

	var buf bytes.Buffer
	zw := gzip.NewWriter(&buf)
	if _, err := zw.Write(payload); err != nil {
		t.Fatalf("failed to gzip payload: %v", err)
	}
	if err := zw.Close(); err != nil {
		t.Fatalf("failed to close gzip writer: %v", err)
	}
	return buf.Bytes()
}

func TestDecompressData_Valid(t *testing.T) {
	original := []byte(`{"user_id":"u1"}`)
	compressed := gzipBytes(t, original)

	out, err := decompressData(compressed)
	if err != nil {
		t.Fatalf("decompressData returned error: %v", err)
	}
	if string(out) != string(original) {
		t.Fatalf("unexpected output: got %q, want %q", string(out), string(original))
	}
}

func TestDecompressData_Invalid(t *testing.T) {
	if _, err := decompressData([]byte("not-gzip")); err == nil {
		t.Fatalf("expected error for invalid gzip payload")
	}
}

func TestDoCompletedTradeSwap_MissingIDs_NoMutation(t *testing.T) {
	pokemonMap := map[string]interface{}{
		"existing": map[string]interface{}{"x": 1},
	}

	doCompletedTradeSwap(map[string]interface{}{
		"username_proposed":  "alice",
		"username_accepting": "bob",
	}, &pokemonMap)

	if len(pokemonMap) != 1 {
		t.Fatalf("expected no mutation, got len=%d", len(pokemonMap))
	}
	if _, ok := pokemonMap["existing"]; !ok {
		t.Fatalf("expected existing entry to remain")
	}
}

func TestDoCompletedTradeSwap_Success(t *testing.T) {
	origDB := db
	defer func() { db = origDB }()

	gdb, mock, sqlDB := setupMockGormDB(t)
	defer sqlDB.Close()
	db = gdb

	columns := []string{
		"instance_id", "user_id", "pokemon_id", "shiny", "lucky", "shadow", "purified",
		"is_caught", "is_for_trade", "is_wanted", "mirror", "pref_lucky", "registered",
		"favorite", "mega", "is_mega", "is_fused", "disabled", "dynamax", "gigantamax", "crown",
	}

	query := regexp.QuoteMeta("SELECT * FROM `instances` WHERE instance_id = ? ORDER BY `instances`.`instance_id` LIMIT ?")
	mock.ExpectQuery(query).
		WithArgs("prop-1", 1).
		WillReturnRows(sqlmock.NewRows(columns).
			AddRow("prop-1", "u-prop", 25, false, false, false, false, true, true, false, false, false, true, false, false, false, false, false, false, false, false))

	mock.ExpectQuery(query).
		WithArgs("acc-1", 1).
		WillReturnRows(sqlmock.NewRows(columns).
			AddRow("acc-1", "u-acc", 150, false, false, false, false, true, true, false, false, false, true, false, false, false, false, false, false, false, false))

	pokemonMap := map[string]interface{}{}
	doCompletedTradeSwap(map[string]interface{}{
		"username_proposed":                  "alice",
		"username_accepting":                 "bob",
		"pokemon_instance_id_user_proposed":  "prop-1",
		"pokemon_instance_id_user_accepting": "acc-1",
	}, &pokemonMap)

	propAny, ok := pokemonMap["prop-1"]
	if !ok {
		t.Fatalf("expected prop-1 in pokemon map")
	}
	propPayload, ok := propAny.(map[string]interface{})
	if !ok {
		t.Fatalf("expected prop payload map, got %T", propAny)
	}
	if got, _ := propPayload["username"].(string); got != "bob" {
		t.Fatalf("expected prop username=bob, got %q", got)
	}
	if got, _ := propPayload["is_caught"].(bool); !got {
		t.Fatalf("expected prop is_caught=true")
	}
	if got, _ := propPayload["is_for_trade"].(bool); got {
		t.Fatalf("expected prop is_for_trade=false")
	}
	if got, _ := propPayload["is_wanted"].(bool); got {
		t.Fatalf("expected prop is_wanted=false")
	}

	accAny, ok := pokemonMap["acc-1"]
	if !ok {
		t.Fatalf("expected acc-1 in pokemon map")
	}
	accPayload, ok := accAny.(map[string]interface{})
	if !ok {
		t.Fatalf("expected acc payload map, got %T", accAny)
	}
	if got, _ := accPayload["username"].(string); got != "alice" {
		t.Fatalf("expected acc username=alice, got %q", got)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestGetUserIDByUsername(t *testing.T) {
	origDB := db
	defer func() { db = origDB }()

	gdb, mock, sqlDB := setupMockGormDB(t)
	defer sqlDB.Close()
	db = gdb

	query := regexp.QuoteMeta("SELECT * FROM `users` WHERE username = ? ORDER BY `users`.`user_id` LIMIT ?")
	mock.ExpectQuery(query).
		WithArgs("adam", 1).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "username"}).AddRow("u-123", "adam"))

	got, err := getUserIDByUsername("adam")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if got != "u-123" {
		t.Fatalf("expected u-123, got %q", got)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}
