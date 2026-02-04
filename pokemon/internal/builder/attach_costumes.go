package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachCostumes(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 3) costumes
	costumeRows, err := b.queryRows(ctx, `
	SELECT cp.*,
	       scp.date_available as shadow_date_available,
	       scp.date_shiny_available as shadow_date_shiny_available,
	       scp.image_url_shadow_costume,
	       scp.image_url_shiny_shadow_costume,
	       scp.image_url_female_shadow_costume,
	       scp.image_url_female_shiny_shadow_costume,
	       cp.image_url_costume_female,
	       cp.image_url_shiny_costume_female
	FROM costume_pokemon cp
	LEFT JOIN shadow_costume_pokemon scp ON cp.costume_id = scp.costume_id
	`)
	if err != nil {
		return err
	}
	for _, c := range costumeRows {
		pid := asInt(c["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}

		costume := orderedjson.Map{M: map[string]any{
			"costume_id":             c["costume_id"],
			"name":                   c["costume_name"],
			"image_url":              c["image_url_costume"],
			"image_url_shiny":        c["image_url_shiny_costume"],
			"image_url_female":       nullIfEmpty(c["image_url_costume_female"]),
			"image_url_shiny_female": nullIfEmpty(c["image_url_shiny_costume_female"]),
			"shiny_available":        c["shiny_available"],
			"date_available":         c["date_available"],
			"date_shiny_available":   c["date_shiny_available"],
		}, Order: costumeKeyOrder}

		if asString(c["image_url_shadow_costume"]) != "" {
			costume.M["shadow_costume"] = orderedjson.Map{M: map[string]any{
				"date_available":                        c["shadow_date_available"],
				"date_shiny_available":                  c["shadow_date_shiny_available"],
				"image_url_shadow_costume":              c["image_url_shadow_costume"],
				"image_url_shiny_shadow_costume":        c["image_url_shiny_shadow_costume"],
				"image_url_female_shadow_costume":       nullIfEmpty(c["image_url_female_shadow_costume"]),
				"image_url_female_shiny_shadow_costume": nullIfEmpty(c["image_url_female_shiny_shadow_costume"]),
			}, Order: shadowCostumeKeyOrder}
		} else {
			costume.M["shadow_costume"] = nil
		}

		appendTo(p, "costumes", costume)
	}
	return nil
}
