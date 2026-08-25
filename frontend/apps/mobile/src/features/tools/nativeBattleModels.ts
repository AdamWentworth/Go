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
  score: number;
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

export const buildNativeRaidAttackers = ({ boss, catalog, instances = {}, requiredType = '', scope = 'catalog' }: {
  boss?: NativeRaidBossEntry | null; catalog: BasePokemon[]; instances?: Record<string, PokemonInstance>; requiredType?: string; scope?: NativeRosterScope;
}): NativeCombatEntry[] => {
  const owned = ownedPokemonIds(instances);
  return catalog.filter((pokemon) => pokemon.available && (scope === 'catalog' || owned.has(pokemon.pokemon_id))).flatMap((pokemon) => {
    const targetTypes = boss?.types ?? [];
    const selected = selectMoves(pokemon, targetTypes, requiredType);
    if (!selected.fast || !selected.charged) return [];
    if (requiredType && moveType(selected.fast) !== requiredType && moveType(selected.charged) !== requiredType) return [];
    const attack = Number(pokemon.attack || 1);
    const bulk = Number(pokemon.defense || 1) * Math.sqrt(Number(pokemon.stamina || 1));
    const dps = attack * selected.dps / 100;
    const tdo = dps * bulk / 225;
    const er = Math.pow(dps, .75) * Math.pow(tdo, .25);
    return [{ chargedMove: selected.charged, cp: pokemon.cp50 || pokemon.cp40 || 0, dps, er, fastMove: selected.fast, id: `${pokemon.pokemon_id}-default`, imageUri: pokemon.image_url, maxKind: null, name: pokemon.name, pokemonId: pokemon.pokemon_id, score: boss ? dps : er, tdo, types: [pokemon.type1_name, pokemon.type2_name].filter(Boolean).map((type) => type.toLocaleLowerCase()) }];
  }).sort((left, right) => right.score - left.score);
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
      return [{ chargedMove: selected.charged, cp: pokemon.cp50 || pokemon.cp40 || 0, dps: damage, er: roleScore, fastMove: selected.fast, id: `${pokemon.pokemon_id}-${kind}`, imageUri, maxKind: kind, name: `${kind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'} ${pokemon.name}`, pokemonId: pokemon.pokemon_id, score: roleScore, tdo: bulk, types: [pokemon.type1_name, pokemon.type2_name].filter(Boolean).map((type) => type.toLocaleLowerCase()) }];
    });
  }).sort((left, right) => right.score - left.score);
};
