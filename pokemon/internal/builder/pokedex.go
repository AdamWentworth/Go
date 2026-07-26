package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

var pokedexSpeciesKeyOrder = []string{
	"pokemon_id",
	"name",
	"pokedex_number",
	"image_url",
	"gender_rate",
	"form",
	"generation",
	"available",
}

// BuildPokedexSpeciesPayload returns every known base catalog row, including
// unreleased Pokemon. The normal catalog intentionally remains release-only.
func (b *Builder) BuildPokedexSpeciesPayload(ctx context.Context) (any, error) {
	rows, err := b.queryRows(ctx, `
		SELECT
		  pokemon_id,
		  name,
		  pokedex_number,
		  image_url,
		  gender_rate,
		  form,
		  generation,
		  available
		FROM pokemon
		WHERE pokedex_number IS NOT NULL
		ORDER BY pokedex_number ASC, pokemon_id ASC
	`)
	if err != nil {
		return nil, err
	}

	payload := make([]any, 0, len(rows))
	for _, row := range rows {
		payload = append(payload, orderedjson.Map{
			M:     row,
			Order: pokedexSpeciesKeyOrder,
		})
	}
	return payload, nil
}
