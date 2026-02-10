// getEvolutionaryFamily.ts
import type { PokemonVariant } from "@/types/pokemonVariants";

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

    const name = String(pokemon.species_name ?? '').toLowerCase();
    if (terms.some((term) => name.includes(term))) {
      seedIds.add(id);
    }

    let neighbors = adjacency.get(id);
    if (!neighbors) {
      neighbors = new Set<number>();
      adjacency.set(id, neighbors);
    }

    for (const next of [...(pokemon.evolves_to || []), ...(pokemon.evolves_from || [])]) {
      const nextId = Number(next);
      if (Number.isFinite(nextId)) neighbors.add(nextId);
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
