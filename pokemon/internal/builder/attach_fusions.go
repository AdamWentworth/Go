package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachFusions(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 5) fusions
	fusionRows, err := b.queryRows(ctx, `
	SELECT 
	  fusion.fusion_id,
	  fusion.base_pokemon_id1,
	  fusion.base_pokemon_id2,
	  fusion.name,
	  fusion.pokedex_number,
	  fusion.image_url,
	  fusion.image_url_shiny,
	  fusion.sprite_url,
	  fusion.attack,
	  fusion.defense,
	  fusion.stamina,
	  fusion.type_1_id,
	  fusion.type_2_id,
	  fusion.generation,
	  fusion.available,
	  fusion.shiny_available,
	  fusion.shiny_rarity,
	  fusion.date_available,
	  fusion.date_shiny_available,
	  t1.name AS type1_name,
	  t2.name AS type2_name
	FROM fusion_pokemon AS fusion
	LEFT JOIN types AS t1 ON fusion.type_1_id = t1.type_id
	LEFT JOIN types AS t2 ON fusion.type_2_id = t2.type_id
	`)
	if err != nil {
		return err
	}
	fusionCP, err := b.getCPBulk(ctx, "fusion_cp_stats", "fusion_id")
	if err != nil {
		return err
	}
	for _, f := range fusionRows {
		fid := asInt(f["fusion_id"])
		cp := fusionCP[fid]

		fusion := orderedjson.Map{M: map[string]any{
			"fusion_id":            f["fusion_id"],
			"base_pokemon_id1":     f["base_pokemon_id1"],
			"base_pokemon_id2":     f["base_pokemon_id2"],
			"name":                 f["name"],
			"pokedex_number":       f["pokedex_number"],
			"image_url":            f["image_url"],
			"image_url_shiny":      f["image_url_shiny"],
			"sprite_url":           f["sprite_url"],
			"attack":               f["attack"],
			"defense":              f["defense"],
			"stamina":              f["stamina"],
			"type_1_id":            f["type_1_id"],
			"type_2_id":            f["type_2_id"],
			"type1_name":           f["type1_name"],
			"type2_name":           f["type2_name"],
			"generation":           f["generation"],
			"available":            f["available"],
			"shiny_available":      f["shiny_available"],
			"shiny_rarity":         f["shiny_rarity"],
			"date_available":       f["date_available"],
			"date_shiny_available": f["date_shiny_available"],
			"cp40":                 cp.cp40,
			"cp50":                 cp.cp50,
		}, Order: fusionKeyOrder}

		id1 := asInt(f["base_pokemon_id1"])
		id2 := asInt(f["base_pokemon_id2"])
		if p, ok := pokemonByID[id1]; ok {
			appendTo(p, "fusion", fusion)
		}
		if p, ok := pokemonByID[id2]; ok {
			appendTo(p, "fusion", fusion)
		}
	}
	return nil
}
