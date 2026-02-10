import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAndProcessVariants } from '@/features/variants/utils/fetchAndProcessVariants';
import { getPokemons } from '@/services/pokemonDataService';
import { getAllVariants } from '@/db/variantsDB';
import { initVariantsDB } from '@/db/init';
import { VARIANTS_STORE } from '@/db/constants';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { BasePokemon } from '@/types/pokemonBase';

import pokemonsFixture from '@/../tests/__helpers__/fixtures/pokemons.json';

vi.mock('@/services/pokemonDataService', () => ({
  getPokemons: vi.fn(),
}));

async function clearVariantsStore() {
  const db = await initVariantsDB();
  if (!db) return;
  await db.clear(VARIANTS_STORE);
}

describe.sequential('fetchAndProcessVariants (integration)', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    await clearVariantsStore();
    vi.mocked(getPokemons).mockResolvedValue((pokemonsFixture as BasePokemon[]).slice(0, 25));
  });

  it('persists generated variants into IndexedDB with variant_id populated', async () => {
    const variants = await fetchAndProcessVariants();
    const persisted = await getAllVariants<PokemonVariant>();

    expect(variants.length).toBeGreaterThan(25);
    expect(persisted.length).toBe(variants.length);
    expect(variants.every((v) => typeof v.variant_id === 'string' && v.variant_id.length > 0)).toBe(true);
    expect(localStorage.getItem('variantsTimestamp')).toBeTruthy();
  });

  it('is deterministic for identical payloads (same variant_id sequence)', async () => {
    const first = await fetchAndProcessVariants();
    const second = await fetchAndProcessVariants();

    expect(second.map((v) => v.variant_id)).toEqual(first.map((v) => v.variant_id));
  });
});
