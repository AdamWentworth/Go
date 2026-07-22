package builder

import (
	"context"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachMaxBattleProfiles(
	ctx context.Context,
	orderedIDs []int,
	pokemonByID map[int]map[string]any,
) error {
	_ = orderedIDs
	rows, err := b.queryRows(ctx, `
	SELECT
	  profile.profile_id,
	  profile.pokemon_id,
	  profile.variant_kind,
	  profile.form,
	  profile.tier_key AS tier,
	  COALESCE(profile.label_override, tier.label) AS label,
	  tier.kind,
	  COALESCE(profile.boss_hp_override, tier.boss_hp) AS boss_hp,
	  COALESCE(profile.default_trainers_override, tier.default_trainers) AS default_trainers,
	  COALESCE(profile.max_trainers_override, tier.max_trainers) AS max_trainers,
	  COALESCE(profile.battle_seconds_override, tier.battle_seconds) AS battle_seconds,
	  COALESCE(profile.enrage_seconds_override, tier.enrage_seconds) AS enrage_seconds,
	  tier.subgroup_size,
	  tier.meter_orb_energy,
	  profile.starts_at,
	  profile.ends_at,
	  profile.is_default,
	  profile.priority,
	  profile.source_name,
	  profile.source_url,
	  profile.notes
	FROM max_battle_profiles AS profile
	JOIN max_battle_tiers AS tier
	  ON tier.tier_key = profile.tier_key
	ORDER BY profile.pokemon_id, profile.priority DESC, profile.profile_id
	`)
	if err != nil {
		return err
	}

	for _, row := range rows {
		pokemonID := asInt(row["pokemon_id"])
		pokemon, ok := pokemonByID[pokemonID]
		if !ok {
			continue
		}
		appendTo(pokemon, "max_battle_profiles", orderedMaxBattleProfile(row))
	}

	return nil
}

func orderedMaxBattleProfile(profile map[string]any) any {
	return orderedjson.Map{M: profile, Order: maxBattleProfileKeyOrder}
}
