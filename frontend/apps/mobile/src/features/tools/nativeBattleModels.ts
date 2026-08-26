import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type {
  BasePokemon,
  Move,
  PokemonMovesChunk,
  PokemonRaidDataChunk,
  RaidBoss,
} from '@pokemongonexus/shared-contracts/pokemon';

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
  types: string[];
};

const typeChart: Record<string, Record<string, number>> = {
  normal: { rock: .625, ghost: .244, steel: .625 }, fire: { fire: .625, water: .625, grass: 1.6, ice: 1.6, bug: 1.6, rock: .625, dragon: .625, steel: 1.6 }, water: { fire: 1.6, water: .625, grass: .625, ground: 1.6, rock: 1.6, dragon: .625 }, electric: { water: 1.6, electric: .625, grass: .625, ground: .244, flying: 1.6, dragon: .625 }, grass: { fire: .625, water: 1.6, grass: .625, poison: .625, ground: 1.6, flying: .625, bug: .625, rock: 1.6, dragon: .625, steel: .625 }, ice: { fire: .625, water: .625, grass: 1.6, ice: .625, ground: 1.6, flying: 1.6, dragon: 1.6, steel: .625 }, fighting: { normal: 1.6, ice: 1.6, poison: .625, flying: .625, psychic: .625, bug: .625, rock: 1.6, ghost: .244, dark: 1.6, steel: 1.6, fairy: .625 }, poison: { grass: 1.6, poison: .625, ground: .625, rock: .625, ghost: .625, steel: .244, fairy: 1.6 }, ground: { fire: 1.6, electric: 1.6, grass: .625, poison: 1.6, flying: .244, bug: .625, rock: 1.6, steel: 1.6 }, flying: { electric: .625, grass: 1.6, fighting: 1.6, bug: 1.6, rock: .625, steel: .625 }, psychic: { fighting: 1.6, poison: 1.6, psychic: .625, dark: .244, steel: .625 }, bug: { fire: .625, grass: 1.6, fighting: .625, poison: .625, flying: .625, psychic: 1.6, ghost: .625, dark: 1.6, steel: .625, fairy: .625 }, rock: { fire: 1.6, ice: 1.6, fighting: .625, ground: .625, flying: 1.6, bug: 1.6, steel: .625 }, ghost: { normal: .244, psychic: 1.6, ghost: 1.6, dark: .625 }, dragon: { dragon: 1.6, steel: .625, fairy: .244 }, dark: { fighting: .625, psychic: 1.6, ghost: 1.6, dark: .625, fairy: .625 }, steel: { fire: .625, water: .625, electric: .625, ice: 1.6, rock: 1.6, steel: .625, fairy: 1.6 }, fairy: { fire: .625, fighting: 1.6, poison: .625, dragon: 1.6, dark: 1.6, steel: .625 },
};
export const nativeTypeEffectiveness = (attack: string, defending: string[]): number => defending.reduce((value, type) => value * (typeChart[attack.toLocaleLowerCase()]?.[type.toLocaleLowerCase()] ?? 1), 1);
const moveType = (move: Move): string => String(move.type_name || move.type || '').toLocaleLowerCase();
const moveSeconds = (move: Move): number => { const raw = Number(move.raid_cooldown); return Math.max(.1, raw > 20 ? raw / 1000 : raw); };
const validFastMoves = (moves: Move[]) => moves.filter((move) => Number(move.is_fast) === 1 && Number(move.raid_power) > 0 && Number(move.raid_cooldown) > 0);
const validChargedMoves = (moves: Move[]) => moves.filter((move) => Number(move.is_fast) === 0 && Number(move.raid_power) > 0 && Number(move.raid_cooldown) > 0);

const FRIENDSHIP_BONUS: Record<NativeRaidFriendship, number> = {
  none: 1,
  good: 1.03,
  great: 1.05,
  ultra: 1.07,
  best: 1.1,
};
const MEGA_ALLY_BONUS: Record<NativeRaidMegaAlly, number> = {
  none: 1,
  general: 1.1,
  matching: 1.3,
};
const PARTY_POWER_BONUS: Record<NativeRaidPartyPower, number> = {
  none: 1,
  party2: 1.18,
  party3: 1.35,
  party4: 1.5,
};

const PARTY_POWER_STRATEGY_BONUS: Record<NativeRaidPartyPowerStrategy, number> = {
  immediate: 1,
  'next-charged': 1.025,
  'strongest-charged': 1.05,
  manual: 1,
};

const BOSS_INCOMING_PRESSURE: Record<NativeRaidBossMovesetMode, number> = {
  expected: 1,
  'monte-carlo': 1,
  favorable: .84,
  hostile: 1.18,
};

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

const selectMoves = (pokemon: BasePokemon, targetTypes: string[] = [], requiredType = ''): { fast: Move | null; charged: Move | null; dps: number } => {
  const ownTypes = [pokemon.type1_name, pokemon.type2_name].filter(Boolean).map((type) => type.toLocaleLowerCase());
  const scoreMove = (move: Move) => Number(move.raid_power) / moveSeconds(move) * (ownTypes.includes(moveType(move)) ? 1.2 : 1) * nativeTypeEffectiveness(moveType(move), targetTypes);
  const fast = [...validFastMoves(pokemon.moves ?? [])].filter((move) => !requiredType || moveType(move) === requiredType).sort((a, b) => scoreMove(b) - scoreMove(a))[0] ?? null;
  const charged = [...validChargedMoves(pokemon.moves ?? [])].filter((move) => !requiredType || moveType(move) === requiredType).sort((a, b) => scoreMove(b) - scoreMove(a))[0] ?? null;
  const fallbackFast = fast ?? [...validFastMoves(pokemon.moves ?? [])].sort((a, b) => scoreMove(b) - scoreMove(a))[0] ?? null;
  const fallbackCharged = charged ?? [...validChargedMoves(pokemon.moves ?? [])].sort((a, b) => scoreMove(b) - scoreMove(a))[0] ?? null;
  const combined = (fallbackFast ? scoreMove(fallbackFast) : 1) * .35 + (fallbackCharged ? scoreMove(fallbackCharged) : 1) * .65;
  return { fast: fallbackFast, charged: fallbackCharged, dps: combined };
};

const ownedPokemonIds = (instances: Record<string, PokemonInstance>): Set<number> => new Set(Object.values(instances).filter((instance) => instance.is_caught && !instance.disabled).map((instance) => Number(instance.pokemon_id)));

const resolveRecordedMove = (moves: Move[], moveId: number | null): Move | null => (
  moveId == null ? null : moves.find((move) => Number(move.move_id) === Number(moveId)) ?? null
);

const describeInstance = (instance: PokemonInstance): string => {
  const details = [
    instance.level == null ? null : `Lv ${instance.level}`,
    instance.cp == null ? null : `CP ${instance.cp.toLocaleString()}`,
    [instance.attack_iv, instance.defense_iv, instance.stamina_iv].every((value) => value != null)
      ? `${instance.attack_iv}/${instance.defense_iv}/${instance.stamina_iv}`
      : null,
  ].filter(Boolean);
  return details.length > 0 ? details.join(' · ') : 'Caught copy';
};

type RaidSource = {
  instance: PokemonInstance | null;
  pokemon: BasePokemon;
  sourceKey: string | null;
};

const buildRaidSources = (
  catalog: BasePokemon[],
  instances: Record<string, PokemonInstance>,
  scope: NativeRosterScope,
): RaidSource[] => {
  const available = catalog.filter((pokemon) => pokemon.available);
  if (scope === 'catalog') return available.map((pokemon) => ({ instance: null, pokemon, sourceKey: null }));
  const byPokemonId = new Map(available.map((pokemon) => [Number(pokemon.pokemon_id), pokemon]));
  return Object.entries(instances).flatMap(([sourceKey, instance]) => {
    if (!instance.is_caught || instance.disabled) return [];
    const pokemon = byPokemonId.get(Number(instance.pokemon_id));
    return pokemon ? [{ instance, pokemon, sourceKey }] : [];
  });
};

const buildMovePairs = (
  pokemon: BasePokemon,
  instance: PokemonInstance | null,
  requiredType: string,
): { charged: Move; fast: Move }[] => {
  const moves = pokemon.moves ?? [];
  const recordedFast = instance ? resolveRecordedMove(moves, instance.fast_move_id) : null;
  const recordedCharged = instance
    ? [
      resolveRecordedMove(moves, instance.charged_move1_id),
      resolveRecordedMove(moves, instance.charged_move2_id),
    ].filter((move): move is Move => move != null)
    : [];
  const fastMoves = recordedFast ? [recordedFast] : validFastMoves(moves);
  const chargedMoves = recordedCharged.length > 0 ? recordedCharged : validChargedMoves(moves);
  return fastMoves.flatMap((fast) => chargedMoves.flatMap((charged) => (
    requiredType && moveType(fast) !== requiredType && moveType(charged) !== requiredType
      ? []
      : [{ charged, fast }]
  )));
};

const scoreRaidPair = ({
  bossTypes,
  charged,
  fast,
  instance,
  pokemon,
  settings,
}: {
  bossTypes: string[];
  charged: Move;
  fast: Move;
  instance: PokemonInstance | null;
  pokemon: BasePokemon;
  settings: NativeRaidSettings;
}) => {
  const ownTypes = [pokemon.type1_name, pokemon.type2_name]
    .filter(Boolean)
    .map((value) => value.toLocaleLowerCase());
  const moveDps = (move: Move) => {
    const type = moveType(move);
    const stab = ownTypes.includes(type) ? 1.2 : 1;
    const weather = settings.weatherBoostedType === type ? 1.2 : 1;
    return Number(move.raid_power) / moveSeconds(move)
      * nativeTypeEffectiveness(type, bossTypes)
      * stab
      * weather;
  };
  const friendship = FRIENDSHIP_BONUS[settings.friendship];
  const mega = MEGA_ALLY_BONUS[settings.megaAllyBonus];
  const party = PARTY_POWER_BONUS[settings.partyPower];
  const partyStrategy = settings.partyPower === 'none'
    ? 1
    : PARTY_POWER_STRATEGY_BONUS[settings.partyPowerStrategy];
  const requestedLevel = Number(settings.attackerLevel);
  const level = instance?.level ?? requestedLevel;
  const levelScale = Math.sqrt(Math.max(1, level) / 50);
  const attackIv = instance?.attack_iv ?? 15;
  const defenseIv = instance?.defense_iv ?? 15;
  const staminaIv = instance?.stamina_iv ?? 15;
  const attack = (Number(pokemon.attack || 1) + attackIv) * levelScale;
  const defense = (Number(pokemon.defense || 1) + defenseIv) * levelScale;
  const stamina = (Number(pokemon.stamina || 1) + staminaIv) * levelScale;
  const combinedMoveDps = moveDps(fast) * .35 + moveDps(charged) * .65 * party;
  const shadowBossDefense = settings.shadowBossMode === 'enraged' ? 3 : 1;
  const dps = attack * combinedMoveDps / 100 * friendship * mega * partyStrategy / shadowBossDefense;
  const dodgeSuccessRate = Math.max(0, Math.min(1, settings.dodgeSuccessRate));
  const dodgeBulk = settings.dodgeStrategy === 'charged'
    ? 1 + .22 * dodgeSuccessRate
    : 1;
  const incomingPressure = BOSS_INCOMING_PRESSURE[settings.bossMovesetMode]
    * (settings.shadowBossMode === 'enraged' ? 1.81 : 1);
  const bulk = defense * Math.sqrt(stamina) * dodgeBulk / incomingPressure;
  const tdo = dps * bulk / 225;
  const activeSeconds = Math.max(1, tdo / Math.max(.1, dps));
  const effectiveDps = dps * activeSeconds / (activeSeconds + Math.max(0, settings.relobbySeconds));
  return {
    dps,
    er: Math.pow(effectiveDps, .75) * Math.pow(tdo, .25),
    score: bossTypes.length > 0 ? effectiveDps : Math.pow(effectiveDps, .75) * Math.pow(tdo, .25),
    tdo,
  };
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
  const scores = buildRaidSources(catalog, instances, scope).flatMap(({ instance, pokemon, sourceKey }) => {
    const pairs = buildMovePairs(pokemon, instance, requiredType);
    const rows = pairs.map(({ charged, fast }, pairIndex) => {
      const metrics = scoreRaidPair({
        bossTypes: boss?.types ?? [],
        charged,
        fast,
        instance,
        pokemon,
        settings: resolvedSettings,
      });
      const sourceId = instance?.instance_id ?? sourceKey ?? null;
      return {
        chargedMove: charged,
        cp: instance?.cp ?? (pokemon.cp50 || pokemon.cp40 || 0),
        dps: metrics.dps,
        er: metrics.er,
        fastMove: fast,
        id: `${sourceId ?? pokemon.pokemon_id}-${fast.move_id}-${charged.move_id}-${pairIndex}`,
        imageUri: pokemon.image_url,
        maxKind: null,
        name: instance?.nickname || pokemon.name,
        pokemonId: pokemon.pokemon_id,
        rosterDetail: instance ? describeInstance(instance) : `Level ${resolvedSettings.attackerLevel.replace('.0', '')}`,
        score: metrics.score,
        sourceInstanceId: sourceId,
        tdo: metrics.tdo,
        types: [pokemon.type1_name, pokemon.type2_name].filter(Boolean).map((value) => value.toLocaleLowerCase()),
      } satisfies NativeCombatEntry;
    }).sort((left, right) => right.score - left.score);
    return resolvedSettings.bestOnly ? rows.slice(0, 1) : rows;
  });
  return scores.sort((left, right) => right.score - left.score);
};

export const buildNativeRaidBosses = (catalog: BasePokemon[]): NativeRaidBossEntry[] => catalog.flatMap((pokemon) => (pokemon.raid_boss ?? []).map((boss) => ({ boss, id: `${pokemon.pokemon_id}-${boss.id}`, imageUri: pokemon.image_url, name: boss.name || pokemon.name, pokemon, types: [pokemon.type1_name, pokemon.type2_name].filter(Boolean).map((type) => type.toLocaleLowerCase()) }))).sort((a, b) => a.pokemon.pokedex_number - b.pokemon.pokedex_number);

export type NativeMaxRole = 'damage' | 'tank' | 'healing';
export const buildNativeMaxRankings = ({ boss, catalog, instances = {}, role, scope = 'catalog', selectedType = '' }: {
  boss?: BasePokemon | null; catalog: BasePokemon[]; instances?: Record<string, PokemonInstance>; role: NativeMaxRole; scope?: NativeRosterScope; selectedType?: string;
}): NativeCombatEntry[] => {
  const owned = ownedPokemonIds(instances);
  const targetTypes = boss ? [boss.type1_name, boss.type2_name].filter(Boolean).map((type) => type.toLocaleLowerCase()) : [];
  return catalog.filter((pokemon) => pokemon.max?.some((form) => Boolean(form.dynamax || form.gigantamax)) && (scope === 'catalog' || owned.has(pokemon.pokemon_id))).flatMap((pokemon) => {
    const forms = pokemon.max?.filter((form) => Boolean(form.dynamax || form.gigantamax)) ?? [];
    return forms.flatMap((form) => {
      const kind: NativeCombatEntry['maxKind'] = form.gigantamax ? 'gigantamax' : 'dynamax';
      const selected = selectMoves(pokemon, targetTypes, selectedType);
      if (!selected.fast) return [];
      const maxType = kind === 'gigantamax' && form.gigantamax_move_type ? form.gigantamax_move_type.toLocaleLowerCase() : moveType(selected.fast);
      if (selectedType && maxType !== selectedType) return [];
      const attack = Number(pokemon.attack || 1);
      const bulk = Number(pokemon.defense || 1) * Math.sqrt(Number(pokemon.stamina || 1));
      const maxPower = kind === 'gigantamax' ? 450 : 350;
      const effectiveness = nativeTypeEffectiveness(maxType, targetTypes);
      const damage = attack * maxPower * effectiveness / 100;
      const roleScore = role === 'damage' ? damage : role === 'tank' ? bulk : bulk * .65 + Number(pokemon.stamina || 0) * 1.6;
      const imageUri = kind === 'gigantamax' ? form.gigantamax_image_url || pokemon.image_url : pokemon.image_url;
      return [{ chargedMove: selected.charged, cp: pokemon.cp50 || pokemon.cp40 || 0, dps: damage, er: roleScore, fastMove: selected.fast, id: `${pokemon.pokemon_id}-${kind}`, imageUri, maxKind: kind, name: `${kind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'} ${pokemon.name}`, pokemonId: pokemon.pokemon_id, rosterDetail: null, score: roleScore, sourceInstanceId: null, tdo: bulk, types: [pokemon.type1_name, pokemon.type2_name].filter(Boolean).map((type) => type.toLocaleLowerCase()) }];
    });
  }).sort((left, right) => right.score - left.score);
};
