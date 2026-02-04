package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachBackgrounds(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 6) backgrounds
	bgRows, err := b.queryRows(ctx, `
	SELECT 
	  pb.pokemon_id,
	  pb.costume_id,
	  b.background_id,
	  b.name,
	  b.location,
	  b.image_url,
	  b.date
	FROM pokemon_backgrounds pb
	INNER JOIN backgrounds b ON pb.background_id = b.background_id
	`)
	if err != nil {
		return err
	}
	for _, row := range bgRows {
		pid := asInt(row["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}
		bg := orderedjson.Map{M: map[string]any{
			"background_id": row["background_id"],
			"name":          row["name"],
			"location":      row["location"],
			"image_url":     row["image_url"],
			"date":          row["date"],
			"costume_id":    nullIfZero(row["costume_id"]),
		}, Order: backgroundKeyOrder}
		appendTo(p, "backgrounds", bg)
	}
	return nil
}
