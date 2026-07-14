package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachCrownForms(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs

	// Optional table: if absent, crown forms are simply not added.
	tableExists, err := b.tableExists(ctx, "crown_forms")
	if err != nil {
		return err
	}
	if !tableExists {
		return nil
	}

	crownRows, err := b.queryRows(ctx, `
	SELECT
	  cf.id,
	  cf.base_pokemon_id,
	  cf.crown_pokemon_id,
	  cf.display_form,
	  p.name,
	  p.form,
	  p.image_url,
	  p.image_url_shiny,
	  p.sprite_url,
	  p.attack,
	  p.defense,
	  p.stamina,
	  p.type_1_id,
	  p.type_2_id,
	  p.date_available,
	  p.date_shiny_available,
	  t1.name AS type1_name,
	  t2.name AS type2_name
	FROM crown_forms cf
	INNER JOIN pokemon p ON p.pokemon_id = cf.crown_pokemon_id
	LEFT JOIN types t1 ON p.type_1_id = t1.type_id
	LEFT JOIN types t2 ON p.type_2_id = t2.type_id
	WHERE COALESCE(cf.is_active, FALSE) IS TRUE
	ORDER BY cf.base_pokemon_id, cf.id
	`)
	if err != nil {
		return err
	}

	// Reuse existing pokemon cp stats keyed by pokemon_id for crown forms.
	pokemonCP, err := b.getCPBulk(ctx, "pokemon_cp_stats", "pokemon_id")
	if err != nil {
		return err
	}

	crownMoveRows, err := b.queryRows(ctx, `
	SELECT
	  pm.pokemon_id AS crown_pokemon_id,
	  pm.legacy,
	  m.*,
	  t.name AS type_name
	FROM pokemon_moves pm
	JOIN moves m ON pm.move_id = m.move_id
	JOIN types t ON m.type_id = t.type_id
	WHERE pm.pokemon_id IN (
	  SELECT crown_pokemon_id
	  FROM crown_forms
	  WHERE COALESCE(is_active, FALSE) IS TRUE
	)
	ORDER BY pm.pokemon_id, m.is_fast DESC, m.name
	`)
	if err != nil {
		return err
	}

	crownMovesByPokemonID := make(map[int][]any)
	for _, r := range crownMoveRows {
		crownPID := asInt(r["crown_pokemon_id"])
		if crownPID == 0 {
			continue
		}

		entry := cloneMap(r)
		delete(entry, "crown_pokemon_id")
		delete(entry, "type_name")
		entry["type"] = lower(asString(r["type_name"]))
		entry["legacy"] = asInt(r["legacy"]) == 1

		crownMovesByPokemonID[crownPID] = append(
			crownMovesByPokemonID[crownPID],
			orderedjson.Map{M: entry, Order: []string{"move_id", "move_name"}},
		)
	}

	for _, crown := range crownRows {
		baseID := asInt(crown["base_pokemon_id"])
		p, ok := pokemonByID[baseID]
		if !ok {
			continue
		}

		crownPID := asInt(crown["crown_pokemon_id"])
		cp := pokemonCP[crownPID]
		moves := crownMovesByPokemonID[crownPID]
		if moves == nil {
			moves = []any{}
		}

		crown["cp40"] = cp.cp40
		crown["cp50"] = cp.cp50
		crown["moves"] = moves

		appendTo(p, "crownForms", orderedjson.Map{M: crown, Order: crownKeyOrder})
	}

	return nil
}
