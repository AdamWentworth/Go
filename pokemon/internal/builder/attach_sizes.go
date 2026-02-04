package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachSizes(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 12) sizes
	sizeRows, err := b.queryRows(ctx, `
	SELECT
	  pokemon_id,
	  pokedex_height,
	  pokedex_weight,
	  height_standard_deviation,
	  weight_standard_deviation,
	  height_xxs_threshold,
	  height_xs_threshold,
	  height_xl_threshold,
	  height_xxl_threshold,
	  weight_xxs_threshold,
	  weight_xs_threshold,
	  weight_xl_threshold,
	  weight_xxl_threshold
	FROM pokemon_sizes
	`)
	if err != nil {
		return err
	}
	for _, sr := range sizeRows {
		pid := asInt(sr["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}
		delete(sr, "pokemon_id")
		p["sizes"] = orderedjson.Map{M: sr, Order: sizesKeyOrder}
	}
	return nil
}
