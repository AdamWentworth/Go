package builder

import "context"

func (b *Builder) attachPokemonCP(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	// 7) pokemon cp40/cp50 (bulk load)
	pokemonCP, err := b.getCPBulk(ctx, "pokemon_cp_stats", "pokemon_id")
	if err != nil {
		return err
	}
	for _, id := range orderedIDs {
		cp := pokemonCP[id]
		pokemonByID[id]["cp40"] = cp.cp40
		pokemonByID[id]["cp50"] = cp.cp50
	}
	return nil
}
