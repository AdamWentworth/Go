package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachMoves(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs

	// 4) moves from pokemon_moves.
	//
	// Keep base behavior intact (including move.fusion_id when present on moves table)
	// so existing clients continue to filter as before.
	baseRows, err := b.queryRows(ctx, `
	SELECT
	  pm.pokemon_id,
	  pm.legacy,
	  m.*,
	  t.name AS type_name
	FROM pokemon_moves pm
	JOIN moves m ON pm.move_id = m.move_id
	JOIN types t ON m.type_id = t.type_id
	ORDER BY pm.pokemon_id, m.is_fast DESC, m.name
	`)
	if err != nil {
		return err
	}

	for _, r := range baseRows {
		pid := asInt(r["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}

		entry := cloneMap(r)
		delete(entry, "pokemon_id")
		entry["type"] = lower(asString(r["type_name"]))
		delete(entry, "type_name")
		entry["legacy"] = (asInt(r["legacy"]) == 1)

		appendTo(p, "moves", orderedjson.Map{M: entry, Order: []string{"move_id", "move_name"}})
	}

	// Fusion-only move enrichment:
	// Pull moves explicitly mapped in fusion_moveset and append rows for each
	// base pokemon side (id1 + id2), tagging them with fusion_id.
	//
	// Keep overlap rows too (same move_id in base + fusion) so strict per-fusion
	// filtering can still resolve full fusion-exclusive move pools with overlaps.
	fusionRows, err := b.queryRows(ctx, `
	SELECT
	  fp.base_pokemon_id1 AS pokemon_id,
	  fm.fusion_id AS fusion_id_override,
	  fm.legacy AS legacy_override,
	  m.*,
	  t.name AS type_name
	FROM fusion_moveset fm
	JOIN fusion_pokemon fp ON fp.fusion_id = fm.fusion_id
	JOIN moves m ON m.move_id = fm.move_id
	JOIN types t ON t.type_id = m.type_id

	UNION ALL

	SELECT
	  fp.base_pokemon_id2 AS pokemon_id,
	  fm.fusion_id AS fusion_id_override,
	  fm.legacy AS legacy_override,
	  m.*,
	  t.name AS type_name
	FROM fusion_moveset fm
	JOIN fusion_pokemon fp ON fp.fusion_id = fm.fusion_id
	JOIN moves m ON m.move_id = fm.move_id
	JOIN types t ON t.type_id = m.type_id
	WHERE fp.base_pokemon_id2 IS NOT NULL
	`)
	if err != nil {
		return err
	}

	for _, r := range fusionRows {
		pid := asInt(r["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}

		entry := cloneMap(r)
		delete(entry, "pokemon_id")
		delete(entry, "fusion_id_override")
		delete(entry, "legacy_override")
		entry["type"] = lower(asString(r["type_name"]))
		delete(entry, "type_name")
		entry["legacy"] = (asInt(r["legacy_override"]) == 1)
		entry["fusion_id"] = asInt(r["fusion_id_override"])

		appendTo(p, "moves", orderedjson.Map{M: entry, Order: []string{"move_id", "move_name"}})
	}

	return nil
}
