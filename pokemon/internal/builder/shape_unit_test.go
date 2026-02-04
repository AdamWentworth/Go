package builder_test

import (
	"testing"
)

func TestStableShapeAssertions_MinimalSample(t *testing.T) {
	arr := []map[string]any{
		{
			"pokemon_id":     1,
			"name":           "Bulbasaur",
			"costumes":       []any{},
			"moves":          []any{},
			"fusion":         []any{},
			"backgrounds":    []any{},
			"megaEvolutions": []any{},
			"raid_boss":      []any{},
			"max":            []any{},
			"female_data":    nil,
			"sizes":          nil,
			"evolutionData":  map[string]any{},
		},
	}
	assertStableShape(t, arr)
}

// assertStableShape is shared by unit/integration tests.
// It enforces the JSON contract the frontend depends on.
func assertStableShape(t *testing.T, arr []map[string]any) {
	t.Helper()

	alwaysArray := []string{
		"costumes",
		"moves",
		"fusion",
		"backgrounds",
		"megaEvolutions",
		"raid_boss",
		"max",
	}

	alwaysPresentAny := []string{
		"female_data",   // nil or object
		"sizes",         // nil or object
		"evolutionData", // must exist; should be object ({} when none)
	}

	for i, p := range arr {
		if _, ok := p["pokemon_id"]; !ok {
			t.Fatalf("pokemon[%d] missing pokemon_id", i)
		}
		if _, ok := p["name"]; !ok {
			t.Fatalf("pokemon[%d] missing name", i)
		}

		for _, k := range alwaysArray {
			v, ok := p[k]
			if !ok {
				t.Fatalf("pokemon[%d] missing key %q", i, k)
			}
			if _, ok := v.([]any); !ok {
				t.Fatalf("pokemon[%d] key %q expected array, got %T", i, k, v)
			}
		}

		for _, k := range alwaysPresentAny {
			if _, ok := p[k]; !ok {
				t.Fatalf("pokemon[%d] missing key %q", i, k)
			}
		}

		// evolutionData should be an object (map) even when empty.
		ev := p["evolutionData"]
		if ev == nil {
			t.Fatalf("pokemon[%d] evolutionData must not be nil; use {} when empty", i)
		}
		if _, ok := ev.(map[string]any); !ok {
			t.Fatalf("pokemon[%d] evolutionData expected object/map, got %T", i, ev)
		}
	}
}
