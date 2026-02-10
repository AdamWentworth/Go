// getDisplayName.ts

import { PokemonVariant } from '@/types/pokemonVariants';

/**
 * Safely resolve a human-friendly Pokémon name from a variant key.
 * Falls back across common fields and finally the key itself.
 */
export function getDisplayName(baseKey: string, variants: PokemonVariant[]): string {
  if (!baseKey) return '';

  // Try canonical variant_id first, then legacy pokemonKey for back-compat.
  const variant =
    variants.find((v) => v.variant_id === baseKey) ||
    (variants as any).find?.((v: any) => v.pokemonKey === baseKey) ||
    (variants as any).find?.((v: any) => v.variant_id === baseKey) ||
    null;

  // Prefer species_name, then name, then the raw key
  return (
    (variant as any)?.name ||
    baseKey
  );
}
