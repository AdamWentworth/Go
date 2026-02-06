package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) loadBasePokemon(ctx context.Context) ([]int, map[int]map[string]any, error) {
	// 1) base pokemon rows (pokemon.* + join extras)
	pokemonRows, err := b.queryRows(ctx, `
	SELECT 
	  pokemon.*,
	  pokemon.female_unique,
	  t1.name AS type1_name,
	  t2.name AS type2_name,
	  sp.shiny_available AS shadow_shiny_available,
	  sp.apex AS shadow_apex,
	  sp.date_available AS date_shadow_available,
	  sp.date_shiny_available AS date_shiny_shadow_available,
	  sp.shiny_rarity AS shiny_shadow_rarity,
	  sp.image_url_shadow,
	  sp.image_url_shiny_shadow,
	  fusion_pokemon.fusion_id,
	  fusion_pokemon.name AS fusion_name,
	  fusion_pokemon.image_url AS fusion_image_url,
	  fusion_pokemon.image_url_shiny AS fusion_image_url_shiny,
	  fusion_pokemon.sprite_url AS fusion_sprite_url,
	  fusion_pokemon.base_pokemon_id1,
	  fusion_pokemon.base_pokemon_id2
	FROM pokemon
	LEFT JOIN types AS t1 ON pokemon.type_1_id = t1.type_id
	LEFT JOIN types AS t2 ON pokemon.type_2_id = t2.type_id
	LEFT JOIN shadow_pokemon AS sp ON pokemon.pokemon_id = sp.pokemon_id
	LEFT JOIN fusion_pokemon ON (
	    pokemon.pokemon_id = fusion_pokemon.base_pokemon_id1
	 OR pokemon.pokemon_id = fusion_pokemon.base_pokemon_id2
	)
	WHERE pokemon.available = 1
	ORDER BY pokemon.pokedex_number ASC
	`)
	if err != nil {
		return nil, nil, err
	}

	pokemonByID := make(map[int]map[string]any, len(pokemonRows))
	orderedIDs := make([]int, 0, len(pokemonRows))

	stripFusionJoinFields := []string{
		"fusion_id",
		"fusion_name",
		"fusion_image_url",
		"fusion_image_url_shiny",
		"fusion_sprite_url",
		"base_pokemon_id1",
		"base_pokemon_id2",
	}

	for _, row := range pokemonRows {
		id, ok := asIntOK(row["pokemon_id"])
		if !ok || id == 0 {
			continue
		}
		if _, exists := pokemonByID[id]; !exists {
			pokemonByID[id] = cloneMap(row)
			orderedIDs = append(orderedIDs, id)

			// Node always has these keys (even if empty arrays), because it repeatedly spreads
			// objects that contain them.
			pokemonByID[id]["costumes"] = []any{}
			pokemonByID[id]["moves"] = []any{}
			pokemonByID[id]["fusion"] = []any{}
			pokemonByID[id]["backgrounds"] = []any{}
			pokemonByID[id]["megaEvolutions"] = []any{}
			pokemonByID[id]["raid_boss"] = []any{}
			pokemonByID[id]["max"] = []any{}

			// Stable-shape defaults: always present optional fields.
			pokemonByID[id]["female_data"] = nil
			pokemonByID[id]["sizes"] = nil
			pokemonByID[id]["evolutionData"] = orderedjson.Map{M: map[string]any{}, Order: evolutionDataKeyOrder}
		}

		type1 := asString(pokemonByID[id]["type1_name"])
		type2 := asString(pokemonByID[id]["type2_name"])
		pokemonByID[id]["type_1_icon"] = iconPath(type1)
		pokemonByID[id]["type_2_icon"] = iconPath(type2)

		// Node formatFusionData destructures these away from the base pokemon object.
		for _, k := range stripFusionJoinFields {
			delete(pokemonByID[id], k)
		}
	}

	return orderedIDs, pokemonByID, nil
}
