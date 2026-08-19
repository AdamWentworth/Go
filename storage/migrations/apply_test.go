package migrations

import (
	"slices"
	"testing"
	"testing/fstest"
)

func TestNamesReturnsOnlySQLFilesInLexicalOrder(t *testing.T) {
	files := fstest.MapFS{
		"0002_second.sql": {Data: []byte("SELECT 2")},
		"README.md":       {Data: []byte("ignored")},
		"0001_first.sql":  {Data: []byte("SELECT 1")},
	}

	names, err := Names(files)
	if err != nil {
		t.Fatalf("Names: %v", err)
	}
	if len(names) != 2 || names[0] != "0001_first.sql" || names[1] != "0002_second.sql" {
		t.Fatalf("unexpected names: %#v", names)
	}
}

func TestEmbeddedMigrationsIncludeSocialProfileSchema(t *testing.T) {
	names, err := Names(Files)
	if err != nil {
		t.Fatalf("Names(Files): %v", err)
	}
	if !slices.Contains(names, "0002_social_profiles.sql") {
		t.Fatalf("social profile migration missing from embedded files: %#v", names)
	}
	if !slices.Contains(names, "0003_trainer_titles.sql") {
		t.Fatalf("trainer titles migration missing from embedded files: %#v", names)
	}
	if !slices.Contains(names, "0004_application_outbox.sql") {
		t.Fatalf("application outbox migration missing from embedded files: %#v", names)
	}
	if !slices.Contains(names, "0005_processed_sync_batches.sql") {
		t.Fatalf("processed sync batches migration missing from embedded files: %#v", names)
	}
	if !slices.Contains(names, "0006_social_pagination_indexes.sql") {
		t.Fatalf("social pagination index migration missing from embedded files: %#v", names)
	}
	if !slices.Contains(names, "0007_wanted_size_preferences.sql") {
		t.Fatalf("wanted size preferences migration missing from embedded files: %#v", names)
	}
}

func TestWithMultiStatementsPreservesExistingQuery(t *testing.T) {
	testCases := map[string]string{
		"user:pass@tcp(mysql:3306)/storage":                       "user:pass@tcp(mysql:3306)/storage?multiStatements=true",
		"user:pass@tcp(mysql:3306)/storage?parseTime=true":        "user:pass@tcp(mysql:3306)/storage?parseTime=true&multiStatements=true",
		"user:pass@tcp(mysql:3306)/storage?multiStatements=false": "user:pass@tcp(mysql:3306)/storage?multiStatements=false",
	}
	for input, expected := range testCases {
		if got := withMultiStatements(input); got != expected {
			t.Fatalf("withMultiStatements(%q) = %q, want %q", input, got, expected)
		}
	}
}
