// getEvolutionaryFamily.ts
import type { PokemonVariant } from "@/types/pokemonVariants";

export function getEvolutionaryFamily(
  searchTerm: string,
  variants: PokemonVariant[]
): Set<number> {
  const terms = searchTerm.split(/[,&+]/) // Split on commas, ampersands, and pluses
    .map(t => t.trim().toLowerCase().replace(/^\+/, '')) // Remove leading +
    .filter(t => t.length > 0);

  const family = new Set<number>();
  const processedNames = new Set<string>();

  // Find all base names (including those from + syntax)
  variants.forEach(p => {
    const pName = p.species_name.toLowerCase();
    if (terms.some(term => pName.includes(term))) {
      processedNames.add(pName);
    }
  });

  // Traversal function for evolutions
  const traverseEvolutions = (id: number) => {
    if (family.has(id)) return;
    
    const pokemon = variants.find(p => p.pokemon_id === id);
    if (!pokemon) return;

    family.add(id);

    // Include both evolves_to and evolves_from
    [...(pokemon.evolves_to || []), ...(pokemon.evolves_from || [])].forEach(traverseEvolutions);
  };

  // Process all matching base pokemon
  variants.forEach(p => {
    if (processedNames.has(p.species_name.toLowerCase())) {
      traverseEvolutions(p.pokemon_id);
    }
  });

  return family;
}