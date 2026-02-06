package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachEvolutions(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	// 8) evolutions
	evoRows, err := b.queryRows(ctx, `SELECT pokemon_id, evolves_to FROM pokemon_evolutions`)
	if err != nil {
		return err
	}

	evolutionMap := map[int]map[string]any{}

	// First pass: ensure keys exist for pokemon_id and evolves_to targets (Node does this).
	for _, e := range evoRows {
		from, okFrom := asIntOK(e["pokemon_id"])
		to, okTo := asIntOK(e["evolves_to"])

		if okFrom && from != 0 {
			if _, ok := evolutionMap[from]; !ok {
				evolutionMap[from] = map[string]any{"evolves_to": []any{}, "evolves_from": []any{}}
			}
		}
		if okTo && to != 0 {
			if _, ok := evolutionMap[to]; !ok {
				evolutionMap[to] = map[string]any{"evolves_to": []any{}, "evolves_from": []any{}}
			}
		}
	}

	// Second pass: fill arrays.
	for _, e := range evoRows {
		from, okFrom := asIntOK(e["pokemon_id"])
		if !okFrom || from == 0 {
			continue
		}
		to, okTo := asIntOK(e["evolves_to"])
		if !okTo || to == 0 {
			continue
		}

		if m, ok := evolutionMap[from]; ok {
			m["evolves_to"] = append(m["evolves_to"].([]any), to)
		}
		if m, ok := evolutionMap[to]; ok {
			m["evolves_from"] = append(m["evolves_from"].([]any), from)
		}
	}

	// Cleanup: delete empty arrays but keep object.
	for id, m := range evolutionMap {
		if a, ok := m["evolves_to"].([]any); ok && len(a) == 0 {
			delete(m, "evolves_to")
		}
		if a, ok := m["evolves_from"].([]any); ok && len(a) == 0 {
			delete(m, "evolves_from")
		}
		evolutionMap[id] = m
	}

	for _, id := range orderedIDs {
		if evoObj, ok := evolutionMap[id]; ok {
			pokemonByID[id]["evolutionData"] = orderedjson.Map{M: evoObj, Order: evolutionDataKeyOrder}
		}
	}
	return nil
}
