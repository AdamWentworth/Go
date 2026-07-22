package builder

import "context"

func (b *Builder) attachMax(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 11) max_pokemon
	maxRows, err := b.queryRows(ctx, `
	SELECT
	  pokemon_id,
	  dynamax,
	  gigantamax,
	  dynamax_release_date,
	  gigantamax_release_date,
	  gigantamax_image_url,
	  shiny_gigantamax_image_url,
	  gigantamax_move_name,
	  gigantamax_move_type_id,
	  max_move_type.name AS gigantamax_move_type
	FROM max_pokemon
	LEFT JOIN types AS max_move_type
	  ON max_move_type.type_id = max_pokemon.gigantamax_move_type_id
	`)
	if err != nil {
		return err
	}
	for _, mr := range maxRows {
		pid := asInt(mr["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}
		appendTo(p, "max", mr)
	}
	return nil
}
