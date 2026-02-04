package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachMoves(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs

	// 4) moves
	//
	// Previous implementation did:
	//   - query moves joined to pokemon_moves (duplicating move rows)
	//   - query pokemon_moves again (SELECT *), then "find" moves by move_id
	//
	// This version is both faster and more contract-stable:
	//   - single query that returns pokemon_id + legacy + move fields
	//   - explicit pokemon_moves columns (pokemon_id, move_id, legacy)
	//
	// NOTE: moves is still selected as m.* because the service currently returns the full move object.
	// If you want a strict public contract for move fields, replace m.* with an explicit column list.
	rows, err := b.queryRows(ctx, `
	SELECT
	  pm.pokemon_id,
	  pm.move_id,
	  pm.legacy,
	  m.*,
	  t.name AS type_name
	FROM pokemon_moves pm
	JOIN moves m ON pm.move_id = m.move_id
	JOIN types t ON m.type_id = t.type_id
	`)
	if err != nil {
		return err
	}

	for _, r := range rows {
		pid := asInt(r["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}

		// Build move entry: start with row clone (includes m.*), then normalize/override.
		entry := cloneMap(r)

		// Remove join helper fields that are not part of the move object in the Node service.
		delete(entry, "pokemon_id")

		// Node uses `type` lowercased, derived from types.name.
		entry["type"] = lower(asString(r["type_name"]))
		delete(entry, "type_name")

		// Ensure legacy is boolean-ish like Node (explicit override).
		entry["legacy"] = (asInt(r["legacy"]) == 1)

		appendTo(p, "moves", orderedjson.Map{M: entry, Order: []string{"move_id", "move_name"}})
	}

	return nil
}
