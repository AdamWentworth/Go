import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchAndProcessVariants } from '@/features/variants/utils/fetchAndProcessVariants';
import { getPokemons } from '@/services/pokemonDataService';
import createPokemonVariants from '@/features/variants/utils/createPokemonVariants';
import { getAllVariants, queueVariantsPersist } from '@/db/variantsDB';
import { computePayloadHash } from '@/features/variants/utils/payloadHash';
import type { PokemonCatalogManifest } from '@shared-contracts/pokemon';

import pokemonsFixture from '@/../tests/__helpers__/fixtures/pokemons.json';
import variantsFixture from '@/../tests/__helpers__/fixtures/variants.json';

vi.mock('@/services/pokemonDataService', () => ({
  getPokemons: vi.fn(),
  getCatalogDataVersion: (manifest: { chunks?: { catalog?: { version?: string } }; catalogVersion?: string } | null) =>
    manifest?.chunks?.catalog?.version ?? manifest?.catalogVersion ?? null,
}));

vi.mock('@/features/variants/utils/createPokemonVariants', () => ({
  default: vi.fn(),
}));

vi.mock('@/db/variantsDB', () => ({
  getAllVariants: vi.fn(),
  queueVariantsPersist: vi.fn(),
}));

describe.sequential('fetchAndProcessVariants (unit)', () => {
  const manifest: PokemonCatalogManifest = {
    schemaVersion: 1,
    catalogVersion: 'catalog-v1',
    generatedAt: '2026-07-14T00:00:00Z',
    chunks: {
      pokemonFull: {
        name: 'pokemonFull',
        endpoint: '/pokemon/pokemons',
        contentType: 'application/json',
        etag: '"catalog-v1"',
        version: 'catalog-v1',
        bytesJson: 100,
        bytesGzip: 50,
      },
    },
  };
  const baseVariants = (variantsFixture as any[]).slice(0, 4).map((v, idx) => ({
    ...v,
    variant_id: (v as any).variant_id ?? `0000-default-${idx}`,
  }));

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    vi.mocked(getPokemons).mockResolvedValue((pokemonsFixture as any[]).slice(0, 2));
    vi.mocked(createPokemonVariants).mockReturnValue(baseVariants as any);
    vi.mocked(getAllVariants).mockResolvedValue(baseVariants as any);
    vi.mocked(queueVariantsPersist).mockImplementation(() => undefined);
  });

  it('fetches API data, validates variant_id uniqueness, and queues persistence', async () => {
    const result = await fetchAndProcessVariants();

    expect(getPokemons).toHaveBeenCalled();
    expect(createPokemonVariants).toHaveBeenCalled();
    expect(queueVariantsPersist).toHaveBeenCalled();
    expect(vi.mocked(queueVariantsPersist).mock.calls[0]?.[0]).toEqual(result);
    expect(vi.mocked(queueVariantsPersist).mock.calls[0]?.[2]).toBeTruthy();

    expect(result.map((v) => v.variant_id)).toEqual(baseVariants.map((v) => v.variant_id));
    for (const variant of result) {
      expect(typeof variant.variant_id).toBe('string');
      expect(variant.variant_id.length).toBeGreaterThan(0);
    }
  });

  it('passes manifest metadata through fetch and queued persistence', async () => {
    const result = await fetchAndProcessVariants({ manifest });

    expect(getPokemons).toHaveBeenCalledWith({ manifest });
    expect(queueVariantsPersist).toHaveBeenCalledWith(
      result,
      expect.any(Number),
      expect.any(String),
      manifest.catalogVersion,
    );
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
    expect(queueVariantsPersist).not.toHaveBeenCalled();
  });

  it('skips transform/persist when API payload hash is unchanged and cache is present', async () => {
    const payload = (pokemonsFixture as any[]).slice(0, 2);
    vi.mocked(getPokemons).mockResolvedValue(payload);
    localStorage.setItem('variantsPayloadHash', computePayloadHash(payload));

    const result = await fetchAndProcessVariants({ manifest });

    expect(getAllVariants).toHaveBeenCalled();
    expect(createPokemonVariants).not.toHaveBeenCalled();
    expect(queueVariantsPersist).not.toHaveBeenCalled();
    expect(result).toEqual(baseVariants);
    expect(localStorage.getItem('variantsTimestamp')).toBeTruthy();
    expect(localStorage.getItem('pokemonCatalogVersion')).toBe(manifest.catalogVersion);
  });
});
