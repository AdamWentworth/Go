import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAndProcessVariants } from '@/features/variants/utils/fetchAndProcessVariants';
import { getPokemons } from '@/services/pokemonDataService';
import createPokemonVariants from '@/features/variants/utils/createPokemonVariants';
import { useImageStore } from '@/stores/useImageStore';
import { putVariantsBulk } from '@/db/variantsDB';

import pokemonsFixture from '@/../tests/__helpers__/fixtures/pokemons.json';
import variantsFixture from '@/../tests/__helpers__/fixtures/variants.json';

vi.mock('@/services/pokemonDataService', () => ({
  getPokemons: vi.fn(),
}));

vi.mock('@/features/variants/utils/createPokemonVariants', () => ({
  default: vi.fn(),
}));

vi.mock('@/stores/useImageStore', () => ({
  useImageStore: {
    getState: vi.fn(),
  },
}));

vi.mock('@/db/variantsDB', () => ({
  putVariantsBulk: vi.fn(),
}));

describe.sequential('fetchAndProcessVariants (unit)', () => {
  const preloadMock = vi.fn();
  const baseVariants = (variantsFixture as any[]).slice(0, 4).map((v, idx) => ({
    ...v,
    variant_id: (v as any).variant_id ?? (v as any).pokemonKey ?? `0000-default-${idx}`,
  }));

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    vi.mocked(getPokemons).mockResolvedValue((pokemonsFixture as any[]).slice(0, 2));
    vi.mocked(createPokemonVariants).mockReturnValue(baseVariants as any);
    vi.mocked(useImageStore.getState).mockReturnValue({ preload: preloadMock } as any);
    vi.mocked(putVariantsBulk).mockResolvedValue(undefined);
  });

  it('fetches API data, preloads images, validates variant_id uniqueness, and stores variants', async () => {
    const result = await fetchAndProcessVariants();

    expect(getPokemons).toHaveBeenCalled();
    expect(createPokemonVariants).toHaveBeenCalled();
    expect(putVariantsBulk).toHaveBeenCalled();
    expect(putVariantsBulk).toHaveBeenCalledWith(result);
    expect(localStorage.getItem('variantsTimestamp')).toBeTruthy();

    expect(result.map((v) => v.variant_id)).toEqual(baseVariants.map((v) => v.variant_id));
    for (const variant of result) {
      expect(typeof variant.variant_id).toBe('string');
      expect(variant.variant_id.length).toBeGreaterThan(0);
    }
    expect(preloadMock).toHaveBeenCalled();
  });

  it('produces stable variant_id values for identical input across calls', async () => {
    const first = await fetchAndProcessVariants();
    const second = await fetchAndProcessVariants();

    const firstIds = first.map((v) => v.variant_id);
    const secondIds = second.map((v) => v.variant_id);
    expect(secondIds).toEqual(firstIds);
  });

  it('throws if generated variants contain duplicate variant_id values', async () => {
    vi.mocked(createPokemonVariants).mockReturnValue([
      { ...(baseVariants[0] as any), variant_id: '0001-default' },
      { ...(baseVariants[1] as any), variant_id: '0001-default' },
    ] as any);

    await expect(fetchAndProcessVariants()).rejects.toThrow(/invalid variant_id set/);
    expect(putVariantsBulk).not.toHaveBeenCalled();
  });
});
