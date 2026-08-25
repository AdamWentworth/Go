import type { PokemonInstance } from "@pokemongonexus/shared-contracts/instances";
import type {
  BasePokemon,
  PokemonPvPFormat,
  PokemonPvPLeagueKey,
  PokemonPvPRankingEntry,
  PokemonPvPRankingsPayload,
} from "@pokemongonexus/shared-contracts/pokemon";
import {
  calculatePokemonCombatPower,
  getPokemonCpMultiplier,
} from "@pokemongonexus/shared-domain/combat-power";

export type NativePvpWorkspace = "rankings" | "team" | "battle" | "iv-rank";
export type NativePvpRole =
  | "overall"
  | "lead"
  | "closer"
  | "switch"
  | "charger"
  | "attacker"
  | "consistency";
export type NativePvpFormat = Pick<
  PokemonPvPFormat,
  | "key"
  | "label"
  | "league"
  | "cup"
  | "cpLimit"
  | "rules"
  | "entries"
  | "mechanics"
>;
const ROLE_INDEX: Record<Exclude<NativePvpRole, "overall">, number> = {
  lead: 0,
  closer: 1,
  switch: 2,
  charger: 3,
  attacker: 4,
  consistency: 5,
};

export const buildNativePvpFormats = (
  payload: PokemonPvPRankingsPayload | null | undefined,
): NativePvpFormat[] => {
  if (!payload) return [];
  const leagues = (
    ["great", "ultra", "master"] as PokemonPvPLeagueKey[]
  ).flatMap((key) => {
    const league = payload.leagues[key];
    return league
      ? [
          {
            key,
            label: `${league.label} League`,
            league: key,
            cup: `${league.label} League`,
            cpLimit: league.cpLimit,
            rules: [] as string[],
            mechanics: "current-2026" as const,
            entries: league.entries,
          },
        ]
      : [];
  });
  const cups = (payload.formats ?? [])
    .filter((format) => format.entries.length > 0)
    .map((format) => ({
      key: format.key,
      label: format.label,
      league: format.league === "little" ? ("great" as const) : format.league,
      cup: format.cup,
      cpLimit: format.cpLimit,
      rules: format.rules,
      mechanics: format.mechanics,
      entries: format.entries,
    }));
  return [...leagues, ...cups];
};

export const pvpRoleScore = (
  entry: PokemonPvPRankingEntry,
  role: NativePvpRole,
): number =>
  role === "overall"
    ? entry.score
    : (entry.categoryScores[ROLE_INDEX[role]] ?? entry.score);

export const filterNativePvpEntries = ({
  entries,
  instances = {},
  query = "",
  role = "overall",
  scope = "catalog",
}: {
  entries: PokemonPvPRankingEntry[];
  instances?: Record<string, PokemonInstance>;
  query?: string;
  role?: NativePvpRole;
  scope?: "catalog" | "owned";
}): PokemonPvPRankingEntry[] => {
  const owned = new Set(
    Object.values(instances)
      .filter((instance) => instance.is_caught && !instance.disabled)
      .map((instance) => Number(instance.pokemon_id)),
  );
  const normalized = query.trim().toLocaleLowerCase();
  return entries
    .filter(
      (entry) =>
        (scope === "catalog" ||
          (entry.pokemonId != null && owned.has(entry.pokemonId))) &&
        (!normalized ||
          [
            entry.name,
            entry.speciesId,
            ...entry.types,
            ...entry.moveset.map((move) => move.name),
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(normalized)),
    )
    .sort((a, b) => pvpRoleScore(b, role) - pvpRoleScore(a, role));
};

export type NativePvpIvSummary = {
  attack: number;
  battleAttack: number;
  battleDefense: number;
  battleHp: number;
  cp: number;
  defense: number;
  level: number;
  rank: number;
  stamina: number;
  statProductPercent: number;
  total: number;
};
const legalIvBuild = (
  pokemon: BasePokemon,
  ivs: { attack: number; defense: number; stamina: number },
  league: PokemonPvPLeagueKey,
): Omit<NativePvpIvSummary, "rank" | "statProductPercent" | "total"> & {
  statProduct: number;
} => {
  const cap = league === "great" ? 1500 : league === "ultra" ? 2500 : null;
  let selectedLevel = 1;
  for (let level = 1; level <= 51; level += 0.5) {
    const cp = calculatePokemonCombatPower(pokemon, ivs, level);
    if (cp == null || (cap != null && cp > cap)) break;
    selectedLevel = level;
  }
  const multiplier = getPokemonCpMultiplier(selectedLevel) ?? 0.094;
  const cp = calculatePokemonCombatPower(pokemon, ivs, selectedLevel) ?? 10;
  const battleAttack = (pokemon.attack + ivs.attack) * multiplier;
  const battleDefense = (pokemon.defense + ivs.defense) * multiplier;
  const battleHp = Math.max(
    10,
    Math.floor((pokemon.stamina + ivs.stamina) * multiplier),
  );
  return {
    ...ivs,
    battleAttack,
    battleDefense,
    battleHp,
    cp,
    level: selectedLevel,
    statProduct: battleAttack * battleDefense * battleHp,
  };
};
export const calculateNativePvpIvSummary = (
  pokemon: BasePokemon,
  selected: { attack: number; defense: number; stamina: number },
  league: PokemonPvPLeagueKey,
): NativePvpIvSummary => {
  const chosen = legalIvBuild(pokemon, selected, league);
  let rank = 1;
  let maximum = chosen.statProduct;
  for (let attack = 0; attack <= 15; attack += 1)
    for (let defense = 0; defense <= 15; defense += 1)
      for (let stamina = 0; stamina <= 15; stamina += 1) {
        const candidate = legalIvBuild(
          pokemon,
          { attack, defense, stamina },
          league,
        );
        if (candidate.statProduct > chosen.statProduct + 0.00001) rank += 1;
        maximum = Math.max(maximum, candidate.statProduct);
      }
  return {
    attack: selected.attack,
    battleAttack: chosen.battleAttack,
    battleDefense: chosen.battleDefense,
    battleHp: chosen.battleHp,
    cp: chosen.cp,
    defense: selected.defense,
    level: chosen.level,
    rank,
    stamina: selected.stamina,
    statProductPercent: (chosen.statProduct / maximum) * 100,
    total: 4096,
  };
};

export const analyzeNativePvpTeam = (entries: PokemonPvPRankingEntry[]) => {
  const types = new Set(entries.flatMap((entry) => entry.types));
  const threatCounts = new Map<string, number>();
  entries
    .flatMap((entry) => entry.counters ?? [])
    .forEach((counter) =>
      threatCounts.set(
        counter.speciesId,
        (threatCounts.get(counter.speciesId) ?? 0) + 1,
      ),
    );
  const sharedThreats = [...threatCounts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  return {
    averageScore: entries.length
      ? entries.reduce((total, entry) => total + entry.score, 0) /
        entries.length
      : 0,
    sharedThreats,
    typeCount: types.size,
  };
};
