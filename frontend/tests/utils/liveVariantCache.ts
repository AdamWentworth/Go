import type { PokemonData } from '@/types/pokemon';
import variantsFixture from '../__helpers__/fixtures/variants.json';

let cache: PokemonData[] | null = null;

export async function useLiveVariants(): Promise<PokemonData[]> {
  if (!cache) {
    cache = variantsFixture as unknown as PokemonData[];
  }
  return structuredClone(cache);
}

