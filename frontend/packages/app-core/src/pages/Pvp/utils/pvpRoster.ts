import { resolveRaidRosterFormProjections } from '@/pages/Raid/utils/raidRosterForms';
import type { InstancesMap, PokemonInstance } from '@/types/pokemonInstance';
import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type {
  PokemonPvPRankingEntry,
  PokemonPvPRankingMove,
} from '@shared-contracts/pokemon';

export type PvPRosterScope = 'catalog' | 'owned';

export type OwnedPvPRankingEntry = {
  entry: PokemonPvPRankingEntry;
  instanceId: string;
  nickname: string | null;
  cp: number;
};

export type OwnedPvPRoster = {
  entries: OwnedPvPRankingEntry[];
  caughtCount: number;
  eligibleCount: number;
  incompleteCount: number;
  overCapCount: number;
  unmatchedCount: number;
};

const normalize = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const hasFiniteNumber = (value: unknown): boolean =>
  Number.isFinite(Number(value));

const moveIsFast = (move: Move): boolean =>
  Number(move.is_fast) === 1;

const findMove = (
  moves: Move[],
  moveId: number | null,
  fast: boolean,
): Move | undefined =>
  moveId == null
    ? undefined
    : moves.find((move) => move.move_id === moveId && moveIsFast(move) === fast);

const toRankingMove = (
  move: Move,
  kind: PokemonPvPRankingMove['kind'],
): PokemonPvPRankingMove => ({
  id: String(move.move_id),
  name: move.name,
  type: move.type_name || move.type || 'normal',
  kind,
});

const recordedMoveset = (
  variant: PokemonVariant,
  instance: PokemonInstance,
): PokemonPvPRankingMove[] | null => {
  const moves = Array.isArray(variant.moves) ? variant.moves : [];
  const fast = findMove(moves, instance.fast_move_id, true);
  const charged = [
    findMove(moves, instance.charged_move1_id, false),
    findMove(moves, instance.charged_move2_id, false),
  ].filter((move): move is Move => move != null);

  if (!fast || charged.length < 2) return null;
  return [
    toRankingMove(fast, 'fast'),
    ...charged.map((move) => toRankingMove(move, 'charged')),
  ];
};

const exactNameMatch = (
  ranking: PokemonPvPRankingEntry,
  variant: PokemonVariant,
): boolean => {
  const rankingName = normalize(ranking.name);
  const speciesName = normalize(variant.species_name);
  const variantName = normalize(variant.name);
  return (
    rankingName === speciesName ||
    rankingName === variantName ||
    normalize(ranking.speciesId) === speciesName ||
    normalize(ranking.speciesId) === variantName
  );
};

const matchRanking = (
  entries: PokemonPvPRankingEntry[],
  variant: PokemonVariant,
  formSource: 'base' | 'fusion' | 'crown',
  instance: PokemonInstance,
): PokemonPvPRankingEntry | undefined => {
  if (formSource === 'fusion' && variant.fusion_id != null) {
    return entries.find((entry) => entry.fusionId === variant.fusion_id);
  }

  const expectedKind = formSource === 'crown'
    ? 'crown'
    : instance.shadow
      ? 'shadow'
      : 'pokemon';
  const candidates = entries.filter(
    (entry) =>
      entry.variantKind === expectedKind &&
      entry.pokemonId === variant.pokemon_id,
  );
  return candidates.find((entry) => exactNameMatch(entry, variant)) ?? candidates[0];
};

const instanceId = (key: string, instance: PokemonInstance): string =>
  String(instance.instance_id || key);

export const buildOwnedPvPRoster = (
  rankings: PokemonPvPRankingEntry[],
  variants: PokemonVariant[],
  instances: InstancesMap,
  cpLimit: number | null,
): OwnedPvPRoster => {
  const variantsById = new Map(
    variants.map((variant) => [String(variant.variant_id), variant]),
  );
  const caught = Object.entries(instances).filter(
    ([, instance]) => instance.is_caught && !instance.disabled,
  );
  const result: OwnedPvPRoster = {
    entries: [],
    caughtCount: caught.length,
    eligibleCount: 0,
    incompleteCount: 0,
    overCapCount: 0,
    unmatchedCount: 0,
  };

  for (const [key, instance] of caught) {
    const cp = Number(instance.cp);
    if (!Number.isFinite(cp) || cp <= 0) {
      result.incompleteCount += 1;
      continue;
    }
    if (cpLimit != null && cp > cpLimit) {
      result.overCapCount += 1;
      continue;
    }
    if (
      !hasFiniteNumber(instance.level) ||
      !hasFiniteNumber(instance.attack_iv) ||
      !hasFiniteNumber(instance.defense_iv) ||
      !hasFiniteNumber(instance.stamina_iv)
    ) {
      result.incompleteCount += 1;
      continue;
    }

    const base = variantsById.get(String(instance.variant_id));
    if (!base) {
      result.unmatchedCount += 1;
      continue;
    }
    const projection = resolveRaidRosterFormProjections(
      variants,
      base,
      instance,
    ).find(({ formSource }) => formSource !== 'mega');
    if (!projection || projection.formSource === 'mega') {
      result.unmatchedCount += 1;
      continue;
    }

    const moveset = recordedMoveset(projection.variant, instance);
    if (!moveset) {
      result.incompleteCount += 1;
      continue;
    }
    const ranking = matchRanking(
      rankings,
      projection.variant,
      projection.formSource,
      instance,
    );
    if (!ranking) {
      result.unmatchedCount += 1;
      continue;
    }

    result.entries.push({
      entry: {
        ...ranking,
        imageUrl: projection.variant.currentImage || ranking.imageUrl,
        moveset,
        recommendedLevel: Number(instance.level),
        attackIv: Number(instance.attack_iv),
        defenseIv: Number(instance.defense_iv),
        staminaIv: Number(instance.stamina_iv),
      },
      instanceId: instanceId(key, instance),
      nickname: instance.nickname,
      cp,
    });
  }

  result.eligibleCount = result.entries.length;
  return result;
};
