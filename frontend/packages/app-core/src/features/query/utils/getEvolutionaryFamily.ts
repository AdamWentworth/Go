// getEvolutionaryFamily.ts
import type { PokemonVariant } from "@/types/pokemonVariants";

const toNumericIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  const ids: number[] = [];
  for (const item of value) {
    const parsed = Number(item);
    if (Number.isFinite(parsed)) ids.push(parsed);
  }
  return ids;
};

export function getEvolutionaryFamily(
  searchTerm: string,
  variants: PokemonVariant[]
): Set<number> {
  const terms = searchTerm
    .split(/[,&+]/)
    .map((t) => t.trim().toLowerCase().replace(/^\+/, ''))
    .filter((t) => t.length > 0);

  if (terms.length === 0) return new Set<number>();

  const seedIds = new Set<number>();
  const adjacency = new Map<number, Set<number>>();

  for (const pokemon of variants) {
    const id = Number(pokemon.pokemon_id);
    if (!Number.isFinite(id)) continue;

    const pokemonWithEvolutionData = pokemon as PokemonVariant & {
      evolutionData?: { evolves_to?: unknown; evolves_from?: unknown };
      evolves_to?: unknown;
      evolves_from?: unknown;
    };

    const name = String(pokemon.species_name ?? '').toLowerCase();
    if (terms.some((term) => name.includes(term))) {
      seedIds.add(id);
    }

    let neighbors = adjacency.get(id);
    if (!neighbors) {
      neighbors = new Set<number>();
      adjacency.set(id, neighbors);
    }

    const evolvesTo = toNumericIds(
      pokemonWithEvolutionData.evolves_to ??
        pokemonWithEvolutionData.evolutionData?.evolves_to,
    );
    const evolvesFrom = toNumericIds(
      pokemonWithEvolutionData.evolves_from ??
        pokemonWithEvolutionData.evolutionData?.evolves_from,
    );

    for (const nextId of [...evolvesTo, ...evolvesFrom]) {
      neighbors.add(nextId);
    }
  }

  const family = new Set<number>();
  const stack = [...seedIds];

  while (stack.length > 0) {
    const id = stack.pop() as number;
    if (family.has(id)) continue;
    family.add(id);

    const neighbors = adjacency.get(id);
    if (!neighbors) continue;
    for (const next of neighbors) {
      if (!family.has(next)) stack.push(next);
    }
  }

  return family;
}
