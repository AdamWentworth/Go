package builder

import "context"

func (b *Builder) attachMax(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 11) max_pokemon
	maxRows, err := b.queryRows(ctx, `SELECT * FROM max_pokemon`)
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
