// getDisplayName.ts

import { PokemonVariant } from '@/types/pokemonVariants';

export function getDisplayName(baseKey: string, variants: PokemonVariant[]): string {
  const variant = variants.find((v) => v.pokemonKey === baseKey);
  return variant?.species_name || baseKey;
}
