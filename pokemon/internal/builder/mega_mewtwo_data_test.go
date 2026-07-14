package builder_test

import (
	"database/sql"
	"math"
	"os"
	"path/filepath"
	"strings"
	"testing"

	_ "modernc.org/sqlite"
)

func TestMegaMewtwoDataRows(t *testing.T) {
	dbPath := resolveLocalSQLitePath(t)
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	defer db.Close()

	tests := []struct {
		name      string
		form      string
		attack    int
		defense   int
		stamina   int
		type1     string
		type2     sql.NullString
		image     string
		shiny     string
		cp40      int
		cp50      int
		available string
	}{
		{
			name:      "Mega Mewtwo X",
			form:      "X",
			attack:    399,
			defense:   215,
			stamina:   228,
			type1:     "Psychic",
			type2:     sql.NullString{String: "Fighting", Valid: true},
			image:     "/images/mega/mega_150_X.png",
			shiny:     "/images/shiny_mega/shiny_mega_150_X.png",
			cp40:      6112,
			cp50:      6910,
			available: "2026-05-25",
		},
		{
			name:      "Mega Mewtwo Y",
			form:      "Y",
			attack:    413,
			defense:   223,
			stamina:   228,
			type1:     "Psychic",
			type2:     sql.NullString{},
			image:     "/images/mega/mega_150_Y.png",
			shiny:     "/images/shiny_mega/shiny_mega_150_Y.png",
			cp40:      6428,
			cp50:      7267,
			available: "2026-05-25",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var row struct {
				id            int
				pokemonID     int
				cost          int
				attack        int
				defense       int
				stamina       int
				image         string
				shiny         string
				primal        sql.NullString
				type1         string
				type2         sql.NullString
				dateAvailable string
			}

			err := db.QueryRow(`
SELECT me.id, me.pokemon_id, me.mega_energy_cost, me.attack, me.defense, me.stamina,
       me.image_url, me.image_url_shiny, CAST(me.primal AS TEXT), t1.name, t2.name,
       me.date_available
FROM mega_evolution me
JOIN types t1 ON t1.type_id = me.type_1_id
LEFT JOIN types t2 ON t2.type_id = me.type_2_id
WHERE me.pokemon_id = 150 AND me.form = ?
`, tc.form).Scan(
				&row.id,
				&row.pokemonID,
				&row.cost,
				&row.attack,
				&row.defense,
				&row.stamina,
				&row.image,
				&row.shiny,
				&row.primal,
				&row.type1,
				&row.type2,
				&row.dateAvailable,
			)
			if err != nil {
				t.Fatalf("query mega row: %v", err)
			}

			if row.pokemonID != 150 {
				t.Fatalf("pokemon_id = %d, want 150", row.pokemonID)
			}
			if row.cost != 300 {
				t.Fatalf("mega_energy_cost = %d, want 300", row.cost)
			}
			if row.attack != tc.attack || row.defense != tc.defense || row.stamina != tc.stamina {
				t.Fatalf("stats = %d/%d/%d, want %d/%d/%d", row.attack, row.defense, row.stamina, tc.attack, tc.defense, tc.stamina)
			}
			if row.type1 != tc.type1 || row.type2.Valid != tc.type2.Valid || row.type2.String != tc.type2.String {
				t.Fatalf("types = %q/%q(valid=%v), want %q/%q(valid=%v)", row.type1, row.type2.String, row.type2.Valid, tc.type1, tc.type2.String, tc.type2.Valid)
			}
			if row.image != tc.image || row.shiny != tc.shiny {
				t.Fatalf("images = %q / %q, want %q / %q", row.image, row.shiny, tc.image, tc.shiny)
			}
			if !strings.HasPrefix(row.dateAvailable, tc.available) {
				t.Fatalf("date_available = %q, want date starting with %q", row.dateAvailable, tc.available)
			}

			cp40 := fetchMegaCP(t, db, row.id, 40)
			cp50 := fetchMegaCP(t, db, row.id, 50)
			if cp40 != tc.cp40 || cp50 != tc.cp50 {
				t.Fatalf("cp40/cp50 = %d/%d, want %d/%d", cp40, cp50, tc.cp40, tc.cp50)
			}

			expectedCP40 := calculatePokemonGoCP(tc.attack, tc.defense, tc.stamina, fetchCPMultiplier(t, db, 40))
			expectedCP50 := calculatePokemonGoCP(tc.attack, tc.defense, tc.stamina, fetchCPMultiplier(t, db, 50))
			if cp40 != expectedCP40 || cp50 != expectedCP50 {
				t.Fatalf("stored CP values do not match Pokemon GO formula: stored %d/%d calculated %d/%d", cp40, cp50, expectedCP40, expectedCP50)
			}
		})
	}
}

func resolveLocalSQLitePath(t *testing.T) string {
	t.Helper()

	candidates := []string{
		filepath.Join("..", "..", "data", "pokego.db"),
		filepath.Join("pokemon", "data", "pokego.db"),
		"data/pokego.db",
	}
	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	t.Skipf("sqlite db not found in %v", candidates)
	return ""
}

func fetchMegaCP(t *testing.T, db *sql.DB, megaID int, level int) int {
	t.Helper()

	var cp int
	if err := db.QueryRow(`SELECT cp FROM mega_cp_stats WHERE mega_id = ? AND level_id = ?`, megaID, level).Scan(&cp); err != nil {
		t.Fatalf("fetch CP for mega_id=%d level=%d: %v", megaID, level, err)
	}
	return cp
}

func fetchCPMultiplier(t *testing.T, db *sql.DB, level int) float64 {
	t.Helper()

	var multiplier float64
	if err := db.QueryRow(`SELECT multiplier FROM cp_multipliers WHERE level_id = ?`, level).Scan(&multiplier); err != nil {
		t.Fatalf("fetch CP multiplier for level=%d: %v", level, err)
	}
	return multiplier
}

func calculatePokemonGoCP(attack int, defense int, stamina int, multiplier float64) int {
	cp := math.Floor(float64(attack+15) * math.Sqrt(float64(defense+15)) * math.Sqrt(float64(stamina+15)) * multiplier * multiplier / 10)
	return int(math.Max(cp, 10))
}
