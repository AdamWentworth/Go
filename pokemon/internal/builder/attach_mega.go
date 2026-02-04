package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachMegaEvolutions(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 9) mega evolutions + mega cp
	megaRows, err := b.queryRows(ctx, `
	SELECT 
	  mega_evolution.id,
	  mega_evolution.mega_energy_cost,
	  mega_evolution.attack,
	  mega_evolution.defense,
	  mega_evolution.stamina,
	  mega_evolution.image_url,
	  mega_evolution.image_url_shiny,
	  mega_evolution.sprite_url,
	  mega_evolution.primal,
	  mega_evolution.form,
	  mega_evolution.type_1_id,
	  mega_evolution.type_2_id,
	  mega_evolution.date_available,
	  t1.name AS type1_name,
	  t2.name AS type2_name,
	  mega_evolution.pokemon_id
	FROM mega_evolution
	LEFT JOIN types AS t1 ON mega_evolution.type_1_id = t1.type_id
	LEFT JOIN types AS t2 ON mega_evolution.type_2_id = t2.type_id
	`)
	if err != nil {
		return err
	}
	megaCP, err := b.getCPBulk(ctx, "mega_cp_stats", "mega_id")
	if err != nil {
		return err
	}
	for _, m := range megaRows {
		pid := asInt(m["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}
		mid := asInt(m["id"])
		cp := megaCP[mid]

		delete(m, "pokemon_id")
		m["cp40"] = cp.cp40
		m["cp50"] = cp.cp50

		appendTo(p, "megaEvolutions", orderedjson.Map{M: m, Order: megaKeyOrder})
	}
	return nil
}
