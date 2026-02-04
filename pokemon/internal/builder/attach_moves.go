package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachMoves(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 4) moves (match Node: allMoves has pm.legacy included via join)
	allMoves, err := b.queryRows(ctx, `
	SELECT 
	  m.*,
	  t.name as type_name,
	  pm.legacy
	FROM moves m
	JOIN types t ON m.type_id = t.type_id
	JOIN pokemon_moves pm ON m.move_id = pm.move_id
	`)
	if err != nil {
		return err
	}
	// Build "allMoves" by move_id (Node uses find() so first match wins).
	moveByID := make(map[int]map[string]any, len(allMoves))
	for _, m := range allMoves {
		mid := asInt(m["move_id"])
		if _, ok := moveByID[mid]; !ok {
			moveByID[mid] = m
		}
	}
	pokemonMoves, err := b.queryRows(ctx, `SELECT * FROM pokemon_moves`)
	if err != nil {
		return err
	}
	for _, pm := range pokemonMoves {
		pid := asInt(pm["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}
		mid := asInt(pm["move_id"])
		mv, ok := moveByID[mid]
		if !ok {
			continue
		}
		entry := cloneMap(mv)
		entry["type"] = lower(asString(mv["type_name"]))
		entry["legacy"] = (asInt(pm["legacy"]) == 1) // overwrite like Node
		appendTo(p, "moves", orderedjson.Map{M: entry, Order: []string{"move_id", "move_name"}})
	}
	return nil
}
