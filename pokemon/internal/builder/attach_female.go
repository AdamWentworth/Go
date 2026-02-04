package builder

import "context"

func (b *Builder) attachFemaleData(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	// 2) female_pokemon (only for those with female_unique=1)
	femaleIDs := make([]int, 0)
	for _, id := range orderedIDs {
		if asInt(pokemonByID[id]["female_unique"]) == 1 {
			femaleIDs = append(femaleIDs, id)
		}
	}
	if len(femaleIDs) == 0 {
		return nil
	}

	q, args := inClause("pokemon_id", femaleIDs)
	rows, err := b.queryRows(ctx, "SELECT * FROM female_pokemon WHERE "+q, args...)
	if err != nil {
		return err
	}
	fm := make(map[int]map[string]any, len(rows))
	for _, r := range rows {
		fm[asInt(r["pokemon_id"])] = r
	}
	for _, id := range femaleIDs {
		if v, ok := fm[id]; ok {
			pokemonByID[id]["female_data"] = v
		}
	}
	return nil
}
