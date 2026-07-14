package catalogimport

import (
	"testing"
	"time"
)

func TestParseBool(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name  string
		input any
		want  bool
		err   bool
	}{
		{name: "sqlite integer true", input: int64(1), want: true},
		{name: "sqlite integer false", input: int64(0), want: false},
		{name: "text true", input: "TRUE", want: true},
		{name: "text false", input: []byte("false"), want: false},
		{name: "legacy none false", input: "None", want: false},
		{name: "invalid text", input: "maybe", err: true},
	}

	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			got, err := ParseBool(testCase.input)
			if (err != nil) != testCase.err {
				t.Fatalf("ParseBool(%v) error = %v, want error=%v", testCase.input, err, testCase.err)
			}
			if err == nil && got != testCase.want {
				t.Fatalf("ParseBool(%v) = %v, want %v", testCase.input, got, testCase.want)
			}
		})
	}
}

func TestCatalogTableNamesExcludeLegacyUserState(t *testing.T) {
	t.Parallel()

	names := CatalogTableNames()
	seen := make(map[string]bool, len(names))
	for _, name := range names {
		seen[name] = true
	}

	for _, required := range []string{"pokemon", "moves", "raid_bosses", "fusion_pokemon"} {
		if !seen[required] {
			t.Fatalf("catalog import is missing %q", required)
		}
	}
	for _, excluded := range []string{"collection", "users", "temp_table"} {
		if seen[excluded] {
			t.Fatalf("catalog import must not include legacy table %q", excluded)
		}
	}
}

func TestReleaseIDs(t *testing.T) {
	t.Parallel()

	if got := NewReleaseID(time.Date(2026, 7, 14, 20, 30, 0, 0, time.UTC), "abcdef1234567890"); got != "catalog-20260714T203000Z-abcdef123456" {
		t.Fatalf("NewReleaseID() = %q", got)
	}
	if _, err := ParseReleaseID("catalog-20260714T203000Z-abcdef123456"); err != nil {
		t.Fatalf("expected valid release ID: %v", err)
	}
	if _, err := ParseReleaseID("catalog release"); err == nil {
		t.Fatal("expected spaces to be rejected")
	}
}

func TestNullIfBlankSQLiteValue(t *testing.T) {
	t.Parallel()

	for _, input := range []any{"", "  ", []byte("\t")} {
		if got := nullIfBlankSQLiteValue(input); got != nil {
			t.Fatalf("nullIfBlankSQLiteValue(%q) = %v, want nil", input, got)
		}
	}
	if got := nullIfBlankSQLiteValue(int64(15)); got != int64(15) {
		t.Fatalf("nullIfBlankSQLiteValue(15) = %v, want 15", got)
	}
	if got := nullIfBlankSQLiteValue("15"); got != "15" {
		t.Fatalf("nullIfBlankSQLiteValue(\"15\") = %v, want \"15\"", got)
	}
}

func TestNormalizeSQLiteValue(t *testing.T) {
	t.Parallel()

	timestamp := time.Date(2016, time.July, 6, 0, 0, 0, 0, time.FixedZone("source", -7*60*60))
	if got := normalizeSQLiteValue(timestamp); got != "2016-07-06T07:00:00Z" {
		t.Fatalf("normalizeSQLiteValue(timestamp) = %q", got)
	}
	if got := normalizeSQLiteValue("unchanged"); got != "unchanged" {
		t.Fatalf("normalizeSQLiteValue(string) = %q", got)
	}
}

func TestLegacyScalarString(t *testing.T) {
	t.Parallel()

	if got := legacyScalarString(int64(1)); got != "1" {
		t.Fatalf("legacyScalarString(1) = %q", got)
	}
	if got := legacyScalarString("None"); got != "None" {
		t.Fatalf("legacyScalarString(None) = %q", got)
	}
	if got := legacyScalarString(nil); got != nil {
		t.Fatalf("legacyScalarString(nil) = %#v, want nil", got)
	}
}
