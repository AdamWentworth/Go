import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type {
  BasePokemon,
  Move,
  PokemonMovesChunk,
  PokemonRaidDataChunk,
  RaidBoss,
} from '@pokemongonexus/shared-contracts/pokemon';
import type { PokemonVariant } from '@pokemongonexus/shared-contracts/variants';
import createPokemonVariants from '@pokemongonexus/app-core/pokemon-variants';
import {
  dedupeBestCounterPerVariant,
  dedupeBestTypeDpsPerVariant,
  getPrimaryRaidMetadataForVariant,
  getRaidTierKeyForVariant,
  isEligibleRaidAttacker,
  isEligibleRaidBoss,
  RAID_TIER_PRESETS,
  scoreRaidCounters,
  scoreBestRaidOverallAttackers,
  scoreRaidOverallAttackers,
  scoreRaidTypeDps,
  type RaidCounterScore,
  type RaidCounterSettings,
  type RaidOverallScore,
  type RaidTierKey,
  type RaidTierPreset,
  type RaidTypeDpsScore,
} from '@pokemongonexus/app-core/raid-model';
import {
  rankMaxBattlePokemon,
  type MaxRankingEntry,
  type MaxRole,
  type MaxRoleCandidates,
} from '@pokemongonexus/app-core/max-battle-model';
import { getTypeEffectivenessMultiplier } from '@pokemongonexus/shared-domain/type-effectiveness';

export const NATIVE_BATTLE_TYPES = ['bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying', 'ghost', 'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock', 'steel', 'water'] as const;
export type NativeBattleType = typeof NATIVE_BATTLE_TYPES[number];
export type NativeRosterScope = 'catalog' | 'owned';
export type NativeRaidAttackerLevel = '40.0' | '50.0' | '51.0';
export type NativeRaidFriendship = 'none' | 'good' | 'great' | 'ultra' | 'best';
export type NativeRaidMegaAlly = 'none' | 'general' | 'matching';
export type NativeRaidPartyPower = 'none' | 'party2' | 'party3' | 'party4';
export type NativeRaidPartyPowerStrategy = 'immediate' | 'next-charged' | 'strongest-charged' | 'manual';
export type NativeRaidDodgeStrategy = 'none' | 'charged';
export type NativeRaidBossMovesetMode = 'expected' | 'monte-carlo' | 'favorable' | 'hostile';
export type NativeRaidShadowBossMode = 'normal' | 'enraged' | 'subdued';

export type NativeRaidSettings = {
  attackerLevel: NativeRaidAttackerLevel;
  bestOnly: boolean;
  friendship: NativeRaidFriendship;
  megaAllyBonus: NativeRaidMegaAlly;
  partyPower: NativeRaidPartyPower;
  partyPowerStrategy: NativeRaidPartyPowerStrategy;
  dodgeStrategy: NativeRaidDodgeStrategy;
  dodgeSuccessRate: number;
  bossMovesetMode: NativeRaidBossMovesetMode;
  shadowBossMode: NativeRaidShadowBossMode;
  relobbySeconds: number;
  weatherBoostedType: string;
};

export const DEFAULT_NATIVE_RAID_SETTINGS: NativeRaidSettings = {
  attackerLevel: '50.0',
  bestOnly: true,
  friendship: 'none',
  megaAllyBonus: 'none',
  partyPower: 'none',
  partyPowerStrategy: 'immediate',
  dodgeStrategy: 'none',
  dodgeSuccessRate: 1,
  bossMovesetMode: 'expected',
  shadowBossMode: 'normal',
  relobbySeconds: 10,
  weatherBoostedType: '',
};

export type NativeCombatEntry = {
  chargedMove: Move | null;
  counter?: {
    dodges: number;
    faints: number;
    relobbies: number;
    simulationWon: boolean;
    soloTimeSeconds: number;
    trainersNeeded: number;
  } | null;
  cp: number;
  dps: number;
  er: number;
  fastMove: Move | null;
  id: string;
  imageUri: string | null;
  maxKind: 'dynamax' | 'gigantamax' | null;
  name: string;
  pokemonId: number;
  rosterDetail: string | null;
  score: number;
  sourceInstanceId: string | null;
  tdo: number;
  types: string[];
};

export type NativeRaidBossEntry = {
  boss: RaidBoss;
  id: string;
  imageUri: string | null;
  name: string;
  pokemon: BasePokemon;
  tier: RaidTierPreset;
  tierKey: RaidTierKey;
  types: string[];
  variant: PokemonVariant;
};

export const nativeTypeEffectiveness = getTypeEffectivenessMultiplier;

export const hydrateNativeToolCatalog = (
  catalog: BasePokemon[],
  moves: PokemonMovesChunk = [],
  raidData: PokemonRaidDataChunk = [],
): BasePokemon[] => {
  const movesById = new Map(moves.map((entry) => [entry.pokemon_id, entry.moves]));
  const raidsById = new Map(raidData.map((entry) => [entry.pokemon_id, entry.raid_boss]));
  return catalog.map((pokemon) => ({ ...pokemon, moves: movesById.get(pokemon.pokemon_id) ?? pokemon.moves ?? [], raid_boss: raidsById.get(pokemon.pokemon_id) ?? pokemon.raid_boss ?? [] }));
};

export const hydrateNativeMaxCatalog = (
  catalog: BasePokemon[],
  maxData: BasePokemon[] = [],
  moves: PokemonMovesChunk = [],
): BasePokemon[] => {
  const maxById = new Map(maxData.map((pokemon) => [pokemon.pokemon_id, pokemon]));
  return hydrateNativeToolCatalog(catalog, moves).map((pokemon) => {
    const supplement = maxById.get(pokemon.pokemon_id);
    if (!supplement) return pokemon;
    return {
      ...pokemon,
      max: supplement.max?.length ? supplement.max : pokemon.max,
      max_battle_profiles: supplement.max_battle_profiles?.length
        ? supplement.max_battle_profiles
        : pokemon.max_battle_profiles,
    };
  });
};

const describeInstance = (instance: PokemonInstance): string => {
  const ivValues = [instance.attack_iv, instance.defense_iv, instance.stamina_iv];
  const ivPercent = ivValues.every((value) => value != null)
    ? Math.round(ivValues.reduce<number>((total, value) => total + Number(value), 0) / 45 * 100)
    : null;
  const details = [
    instance.nickname?.trim() || null,
    instance.level == null ? null : `Level ${instance.level}`,
    ivPercent == null ? null : `${ivPercent}% IV`,
  ].filter(Boolean);
  return details.length > 0 ? details.join(' · ') : 'Caught copy';
};

const resolveRecordedMove = (moves: Move[], moveId: number | null): Move | null => (
  moveId == null ? null : moves.find((move) => Number(move.move_id) === Number(moveId)) ?? null
);

const canonicalRaidSettings = (settings: NativeRaidSettings): RaidCounterSettings => ({
  attackerLevel: settings.attackerLevel,
  bossMovesetMode: settings.bossMovesetMode,
  dodgeStrategy: settings.dodgeStrategy,
  dodgeSuccessRate: settings.dodgeSuccessRate,
  friendship: settings.friendship,
  megaAllyBonus: settings.megaAllyBonus,
  partyPower: settings.partyPower,
  partyPowerStrategy: settings.partyPowerStrategy,
  relobbySeconds: settings.relobbySeconds,
  shadowBossMode: settings.shadowBossMode,
  weatherBoostedType: settings.weatherBoostedType,
});

const hasRecordedRaidBuild = (instance: PokemonInstance): boolean => (
  Number.isFinite(Number(instance.level))
  && [instance.attack_iv, instance.defense_iv, instance.stamina_iv]
    .every((value) => value != null && Number.isFinite(Number(value)))
  && instance.fast_move_id != null
  && (instance.charged_move1_id != null || instance.charged_move2_id != null)
);

const buildCanonicalRaidAttackers = (
  catalog: BasePokemon[],
  instances: Record<string, PokemonInstance>,
  scope: NativeRosterScope,
): { attackers: PokemonVariant[]; bossTargets: PokemonVariant[] } => {
  const variants = createPokemonVariants(catalog);
  const bossTargets = variants.filter(isEligibleRaidBoss);
  if (scope === 'catalog') {
    return { attackers: variants.filter(isEligibleRaidAttacker), bossTargets };
  }

  const variantsById = new Map(variants.map((variant) => [variant.variant_id, variant]));
  const defaultByPokemonId = new Map(
    variants
      .filter((variant) => variant.variantType === 'default')
      .map((variant) => [Number(variant.pokemon_id), variant]),
  );
  const attackers = Object.entries(instances).flatMap(([sourceKey, instance]) => {
    if (!instance.is_caught || instance.disabled || !hasRecordedRaidBuild(instance)) return [];
    const base = variantsById.get(String(instance.variant_id))
      ?? defaultByPokemonId.get(Number(instance.pokemon_id));
    if (!base) return [];
    const sourceId = String(instance.instance_id || sourceKey);
    const attacker: PokemonVariant = {
      ...base,
      instanceData: { ...instance, instance_id: sourceId },
      raidRoster: {
        cpSource: Number(instance.cp) > 0 ? 'recorded' : 'calculated',
        formSource: 'base',
        instanceId: sourceId,
        ivSource: 'recorded',
        levelSource: 'recorded',
        moveSource: 'recorded',
        source: 'caught',
      },
      variant_id: `${base.variant_id}::caught::${sourceId}`,
    };
    return isEligibleRaidAttacker(attacker) ? [attacker] : [];
  });
  return { attackers, bossTargets };
};

const canonicalCombatEntry = (
  score: RaidOverallScore | RaidTypeDpsScore,
  _settings: NativeRaidSettings,
): NativeCombatEntry => {
  const variant = score.variant;
  const instance = variant.instanceData ?? null;
  return {
    chargedMove: score.chargedMove,
    counter: null,
    cp: score.cp,
    dps: score.dps,
    er: score.er,
    fastMove: score.fastMove,
    id: `${variant.variant_id}-${score.fastMove.move_id}-${score.chargedMove.move_id}`,
    imageUri: variant.currentImage || variant.image_url || null,
    maxKind: null,
    name: variant.name,
    pokemonId: variant.pokemon_id,
    rosterDetail: instance ? describeInstance(instance) : null,
    score: score.eDps,
    sourceInstanceId: instance?.instance_id ?? null,
    tdo: score.tdo,
    types: [variant.type1_name, variant.type2_name]
      .filter(Boolean)
      .map((value) => value.toLocaleLowerCase()),
  };
};

const canonicalCounterEntry = (
  score: RaidCounterScore,
  tier: RaidTierPreset,
  _settings: NativeRaidSettings,
): NativeCombatEntry => {
  const variant = score.variant;
  const instance = variant.instanceData ?? null;
  const estimatedShare = tier.bossHp / Math.max(1, score.trainersNeeded);
  return {
    chargedMove: score.chargedMove,
    counter: {
      dodges: score.dodges,
      faints: score.faints,
      relobbies: score.relobbies,
      simulationWon: score.simulationWon,
      soloTimeSeconds: score.soloTimeSeconds,
      trainersNeeded: score.trainersNeeded,
    },
    cp: score.cp,
    dps: score.dps,
    er: score.dps,
    fastMove: score.fastMove,
    id: `${variant.variant_id}-${score.fastMove.move_id}-${score.chargedMove.move_id}`,
    imageUri: variant.currentImage || variant.image_url || null,
    maxKind: null,
    name: variant.name,
    pokemonId: variant.pokemon_id,
    rosterDetail: instance ? describeInstance(instance) : null,
    score: score.dps,
    sourceInstanceId: instance?.instance_id ?? null,
    tdo: Math.max(0, estimatedShare),
    types: [variant.type1_name, variant.type2_name]
      .filter(Boolean)
      .map((value) => value.toLocaleLowerCase()),
  };
};

const buildCanonicalRaidRankings = ({
  catalog,
  instances,
  requiredType,
  scope,
  settings,
}: {
  catalog: BasePokemon[];
  instances: Record<string, PokemonInstance>;
  requiredType: string;
  scope: NativeRosterScope;
  settings: NativeRaidSettings;
}): NativeCombatEntry[] => {
  const { attackers, bossTargets } = buildCanonicalRaidAttackers(catalog, instances, scope);
  const canonicalSettings = canonicalRaidSettings(settings);
  const scores = requiredType
    ? scoreRaidTypeDps(attackers, requiredType, canonicalSettings, bossTargets)
    : settings.bestOnly
      ? scoreBestRaidOverallAttackers(attackers, canonicalSettings, bossTargets)
      : scoreRaidOverallAttackers(attackers, canonicalSettings);
  const selectedScores = requiredType && settings.bestOnly
    ? dedupeBestTypeDpsPerVariant(scores as RaidTypeDpsScore[])
    : scores;
  return selectedScores.map((score) => canonicalCombatEntry(score, settings));
};

export const buildNativeRaidAttackers = ({ boss, catalog, instances = {}, requiredType = '', scope = 'catalog', settings }: {
  boss?: NativeRaidBossEntry | null;
  catalog: BasePokemon[];
  instances?: Record<string, PokemonInstance>;
  requiredType?: string;
  scope?: NativeRosterScope;
  settings?: Partial<NativeRaidSettings>;
}): NativeCombatEntry[] => {
  const resolvedSettings = { ...DEFAULT_NATIVE_RAID_SETTINGS, ...settings };
  if (!boss) {
    return buildCanonicalRaidRankings({
      catalog,
      instances,
      requiredType,
      scope,
      settings: resolvedSettings,
    });
  }
  const { attackers } = buildCanonicalRaidAttackers(catalog, instances, scope);
  const scores = scoreRaidCounters(
    attackers,
    boss.variant,
    boss.tier,
    canonicalRaidSettings(resolvedSettings),
  );
  const selectedScores = resolvedSettings.bestOnly
    ? dedupeBestCounterPerVariant(scores)
    : scores;
  return selectedScores.map((score) => canonicalCounterEntry(score, boss.tier, resolvedSettings));
};

export const buildNativeRaidBosses = (catalog: BasePokemon[]): NativeRaidBossEntry[] => {
  const pokemonById = new Map(catalog.map((pokemon) => [Number(pokemon.pokemon_id), pokemon]));
  return createPokemonVariants(catalog)
    .filter(isEligibleRaidBoss)
    .flatMap((variant) => {
      const boss = getPrimaryRaidMetadataForVariant(variant);
      const tierKey = getRaidTierKeyForVariant(variant);
      const pokemon = pokemonById.get(Number(variant.pokemon_id));
      if (!boss || !tierKey || !pokemon) return [];
      return [{
        boss,
        id: variant.variant_id,
        imageUri: variant.currentImage || variant.image_url || null,
        name: variant.name,
        pokemon,
        tier: RAID_TIER_PRESETS[tierKey],
        tierKey,
        types: [variant.type1_name, variant.type2_name]
          .filter(Boolean)
          .map((type) => type.toLocaleLowerCase()),
        variant,
      } satisfies NativeRaidBossEntry];
    })
    .sort((a, b) => a.pokemon.pokedex_number - b.pokemon.pokedex_number || a.name.localeCompare(b.name));
};

export type NativeMaxRole = 'damage' | 'tank' | 'healing';

const maxVariant = (
  pokemon: BasePokemon,
  variantType: PokemonVariant['variantType'],
  currentImage: string,
  overrides: Partial<PokemonVariant> = {},
): PokemonVariant => {
  const prefix = variantType === 'gigantamax'
    ? 'Gigantamax '
    : variantType === 'dynamax'
      ? 'Dynamax '
      : '';
  return {
    ...pokemon,
    currentImage,
    name: `${prefix}${pokemon.name}`,
    species_name: pokemon.name,
    variant_id: `${String(pokemon.pokemon_id).padStart(4, '0')}-${variantType}`,
    variantType,
    ...overrides,
  };
};

export const buildNativeMaxVariants = (catalog: BasePokemon[]): PokemonVariant[] =>
  catalog.flatMap((pokemon) => {
    const variants: PokemonVariant[] = [];
    const maxForms = pokemon.max ?? [];
    if (maxForms.some((form) => Boolean(form.dynamax))) {
      variants.push(maxVariant(pokemon, 'dynamax', pokemon.image_url));
    }
    maxForms.filter((form) => Boolean(form.gigantamax)).forEach((form) => {
      variants.push(maxVariant(
        pokemon,
        'gigantamax',
        form.gigantamax_image_url || pokemon.image_url,
      ));
    });
    if (pokemon.pokemon_id === 890) {
      variants.push(maxVariant(pokemon, 'default', pokemon.image_url));
    }
    if (pokemon.pokemon_id === 888 || pokemon.pokemon_id === 889) {
      (pokemon.crownForms ?? []).forEach((crown) => {
        const form = crown.form ?? (pokemon.pokemon_id === 888
          ? 'crowned_sword'
          : 'crowned_shield');
        variants.push(maxVariant(pokemon, 'default', crown.image_url || pokemon.image_url, {
          attack: crown.attack ?? pokemon.attack,
          cp40: crown.cp40 ?? pokemon.cp40,
          cp50: crown.cp50 ?? pokemon.cp50,
          defense: crown.defense ?? pokemon.defense,
          form,
          moves: crown.moves?.length ? crown.moves : pokemon.moves,
          name: crown.name || pokemon.name,
          stamina: crown.stamina ?? pokemon.stamina,
          type1_name: crown.type1_name ?? pokemon.type1_name,
          type2_name: crown.type2_name ?? pokemon.type2_name,
          variant_id: `${String(pokemon.pokemon_id).padStart(4, '0')}-${form}`,
        }));
      });
    }
    return variants;
  });

const personalizeNativeMaxVariants = (
  variants: PokemonVariant[],
  instances: Record<string, PokemonInstance>,
): PokemonVariant[] => {
  const candidatesByPokemon = new Map<number, PokemonVariant[]>();
  variants.forEach((variant) => {
    const candidates = candidatesByPokemon.get(variant.pokemon_id) ?? [];
    candidates.push(variant);
    candidatesByPokemon.set(variant.pokemon_id, candidates);
  });
  return Object.entries(instances).flatMap(([sourceKey, instance]) => {
    if (!instance.is_caught || instance.disabled) return [];
    const candidates = candidatesByPokemon.get(Number(instance.pokemon_id)) ?? [];
    const requested = instance.crown
      ? candidates.find((variant) => variant.form?.toLocaleLowerCase().includes('crowned'))
      : instance.gigantamax
        ? candidates.find((variant) => variant.variantType.includes('gigantamax'))
        : instance.dynamax
          ? candidates.find((variant) => variant.variantType.includes('dynamax'))
          : candidates.find((variant) => variant.variantType === 'default');
    if (!requested) return [];
    const recordedFast = resolveRecordedMove(requested.moves ?? [], instance.fast_move_id);
    const hasRecordedIvs = [instance.attack_iv, instance.defense_iv, instance.stamina_iv]
      .every((value) => value != null && Number.isFinite(Number(value)));
    const hasLevelOrCp = Number(instance.level) > 0 || Number(instance.cp) > 0;
    if (!recordedFast || !hasRecordedIvs || !hasLevelOrCp) return [];
    const instanceId = String(instance.instance_id || sourceKey);
    return [{
      ...requested,
      instanceData: { ...instance, instance_id: instanceId },
      moves: [
        recordedFast,
        ...(requested.moves ?? []).filter((move) => Number(move.is_fast) === 0),
      ],
      raidRoster: {
        cpSource: Number(instance.cp) > 0 ? 'recorded' : 'calculated',
        formSource: instance.crown ? 'crown' : 'base',
        instanceId,
        ivSource: 'recorded',
        levelSource: Number(instance.level) > 0 ? 'recorded' : 'inferred',
        moveSource: 'recorded',
        source: 'caught',
      },
      variant_id: `${requested.variant_id}::max-caught::${instanceId}`,
    } satisfies PokemonVariant];
  });
};

type NativeMaxRankingOptions = {
  boss?: BasePokemon | null;
  bossVariant?: PokemonVariant | null;
  catalog: BasePokemon[];
  instances?: Record<string, PokemonInstance>;
  role: NativeMaxRole;
  scope?: NativeRosterScope;
  selectedType?: string;
};

export const buildNativeMaxBossVariant = (
  boss?: BasePokemon | null,
): PokemonVariant | null => {
  if (!boss) return null;
  const variants = buildNativeMaxVariants([boss]);
  return variants.find((variant) => variant.variantType.includes('gigantamax'))
    ?? variants[0]
    ?? null;
};

export const buildNativeMaxCanonicalRankings = ({
  boss,
  bossVariant,
  catalog,
  instances = {},
  role,
  scope = 'catalog',
  selectedType = '',
}: NativeMaxRankingOptions): MaxRankingEntry[] => {
  const catalogVariants = buildNativeMaxVariants(catalog);
  const rankingVariants = scope === 'owned'
    ? personalizeNativeMaxVariants(catalogVariants, instances)
    : catalogVariants;
  return rankMaxBattlePokemon(rankingVariants, {
    boss: bossVariant ?? buildNativeMaxBossVariant(boss),
    role: role as MaxRole,
    selectedType,
  });
};

export const buildNativeMaxRoleCandidates = (
  options: Omit<NativeMaxRankingOptions, 'role' | 'selectedType'>,
): MaxRoleCandidates => ({
  damage: buildNativeMaxCanonicalRankings({ ...options, role: 'damage' }),
  tank: buildNativeMaxCanonicalRankings({ ...options, role: 'tank' }),
  healing: buildNativeMaxCanonicalRankings({ ...options, role: 'healing' }),
});

export const buildNativeMaxRankings = (
  options: NativeMaxRankingOptions,
): NativeCombatEntry[] => buildNativeMaxCanonicalRankings(options).map((entry) => ({
    chargedMove: entry.chargedMove,
    cp: entry.cp,
    dps: entry.bossBenchmark?.maxHitDamage ?? entry.attackIndex,
    er: entry.score,
    fastMove: entry.fastMove,
    id: entry.variant.variant_id,
    imageUri: entry.variant.currentImage || entry.variant.image_url || null,
    maxKind: entry.maxForm === 'special' ? null : entry.maxForm,
    name: entry.displayName,
    pokemonId: entry.variant.pokemon_id,
    rosterDetail: entry.personalized
      ? `Level ${entry.levelLabel}${entry.ivPercent == null ? '' : ` · ${entry.ivPercent}% IV`}`
      : null,
    score: entry.score,
    sourceInstanceId: entry.variant.instanceData?.instance_id ?? null,
    tdo: entry.effectiveBulk,
    types: [entry.variant.type1_name, entry.variant.type2_name]
      .filter(Boolean)
      .map((type) => type.toLocaleLowerCase()),
  }));
