import type { PokemonVariant } from '@/types/pokemonVariants';
import variantsFixture from '../__helpers__/fixtures/variants.json';

let cache: PokemonVariant[] | null = null;

export async function useLiveVariants(): Promise<PokemonVariant[]> {
  if (!cache) {
    cache = variantsFixture as unknown as PokemonVariant[];
  }
  return structuredClone(cache);
}
