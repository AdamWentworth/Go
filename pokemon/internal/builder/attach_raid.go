package builder

import "context"

func (b *Builder) attachRaidBoss(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs
	// 10) raid bosses
	raidRows, err := b.queryRows(ctx, `SELECT * FROM raid_bosses`)
	if err != nil {
		return err
	}
	for _, rr := range raidRows {
		pid := asInt(rr["pokemon_id"])
		p, ok := pokemonByID[pid]
		if !ok {
			continue
		}
		appendTo(p, "raid_boss", rr)
	}
	return nil
}
