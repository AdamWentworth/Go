import type {
  PokemonMovesChunk,
  PokemonRaidDataChunk,
  RaidBoss,
} from '@shared-contracts/pokemon';

import type { PokemonVariant } from '@/types/pokemonVariants';
import { matchFormsAndVariantType } from '@/utils/formMatcher';

const toNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function mergePokemonMovesChunk(
  variants: PokemonVariant[],
  movesChunk: PokemonMovesChunk,
): PokemonVariant[] {
  const movesByPokemonID = new Map(movesChunk.map((entry) => [Number(entry.pokemon_id), entry]));

  return variants.map((variant) => {
    const entry = movesByPokemonID.get(Number(variant.pokemon_id));
    if (!entry) return variant;

    const fusionMovesByID = new Map(
      entry.fusion.map((fusion) => [toNumber(fusion.fusion_id), fusion.moves ?? []]),
    );
    const crownMovesByID = new Map(
      entry.crownForms.map((crown) => [toNumber(crown.id), crown.moves ?? []]),
    );

    return {
      ...variant,
      moves: entry.moves ?? [],
      fusion: (variant.fusion ?? []).map((fusion) => ({
        ...fusion,
        moves: fusionMovesByID.get(toNumber(fusion.fusion_id)) ?? fusion.moves ?? [],
      })),
      crownForms: (variant.crownForms ?? []).map((crown) => ({
        ...crown,
        moves: crownMovesByID.get(toNumber(crown.id)) ?? crown.moves ?? [],
      })),
    };
  });
}

function matchingRaidEntries(variant: PokemonVariant, raidBosses: RaidBoss[]): RaidBoss[] {
  return raidBosses.filter((raidBoss) =>
    matchFormsAndVariantType(variant.form, raidBoss.form, variant.variantType, {
      raidBossName: raidBoss.name,
      raidBossTier: raidBoss.tier,
      raidBossCostumeId: raidBoss.costume_id,
      variantName: variant.species_name || variant.name,
    }),
  );
}

export function mergePokemonRaidDataChunk(
  variants: PokemonVariant[],
  raidDataChunk: PokemonRaidDataChunk,
): PokemonVariant[] {
  const raidsByPokemonID = new Map(
    raidDataChunk.map((entry) => [Number(entry.pokemon_id), entry.raid_boss ?? []]),
  );

  return variants.map((variant) => {
    const raidBosses = raidsByPokemonID.get(Number(variant.pokemon_id));
    if (!raidBosses) return variant;

    const matchingEntries = matchingRaidEntries(variant, raidBosses);
    if (matchingEntries.length === 0) {
      const variantWithoutRaidData: PokemonVariant = { ...variant };
      delete variantWithoutRaidData.raid_boss;
      return variantWithoutRaidData;
    }

    return { ...variant, raid_boss: matchingEntries };
  });
}
