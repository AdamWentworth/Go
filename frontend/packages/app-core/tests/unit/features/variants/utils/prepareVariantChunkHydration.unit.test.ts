import { describe, expect, it, vi } from 'vitest';

import {
  hasHydratedMoves,
  hasHydratedRaidData,
  prepareVariantChunkHydration,
} from '@/features/variants/utils/prepareVariantChunkHydration';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonCatalogManifest } from '@shared-contracts/pokemon';

const manifest = {
  schemaVersion: 2,
  catalogVersion: 'catalog-v2',
  generatedAt: '2026-07-16T00:00:00Z',
  chunks: {
    pokemonFull: {
      name: 'pokemonFull',
      endpoint: '/catalog/pokemon-full',
      contentType: 'application/json',
      etag: '"catalog-v2"',
      version: 'catalog-v2',
      bytesJson: 1,
      bytesGzip: 1,
    },
    moves: {
      name: 'moves',
      endpoint: '/catalog/moves',
      contentType: 'application/json',
      etag: '"moves-v2"',
      version: 'moves-v2',
      bytesJson: 1,
      bytesGzip: 1,
    },
  },
} satisfies PokemonCatalogManifest;

const variant = (name: string, moves: PokemonVariant['moves'] = []): PokemonVariant =>
  ({
    pokemon_id: 1,
    name,
    species_name: name,
    variantType: 'default',
    moves,
    fusion: [],
    crownForms: [],
  }) as unknown as PokemonVariant;

describe('prepareVariantChunkHydration', () => {
  it('treats a matching marker as current only when the data is actually attached', async () => {
    const fetchChunk = vi.fn();

    const result = await prepareVariantChunkHydration({
      manifest,
      chunkName: 'moves',
      storedVersion: 'moves-v2',
      getVariants: () => [variant('Bulbasaur', [{ move_id: 1, name: 'Tackle' } as any])],
      hasHydratedData: hasHydratedMoves,
      fetchChunk,
    });

    expect(result).toBeNull();
    expect(fetchChunk).not.toHaveBeenCalled();
  });

  it('loads a matching-version chunk when a catalog replacement removed its data', async () => {
    const fetchChunk = vi.fn().mockResolvedValue([{ pokemon_id: 1 }]);

    const result = await prepareVariantChunkHydration({
      manifest,
      chunkName: 'moves',
      storedVersion: 'moves-v2',
      getVariants: () => [variant('Bulbasaur')],
      hasHydratedData: hasHydratedMoves,
      fetchChunk,
    });

    expect(fetchChunk).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      chunkVersion: 'moves-v2',
      catalogVersion: 'catalog-v2',
      chunk: [{ pokemon_id: 1 }],
    });
  });

  it('recognizes raid history independently from move hydration', () => {
    const withMoves = variant('Bulbasaur', [{ move_id: 1, name: 'Tackle' } as any]);
    const withRaidHistory = {
      ...variant('Ivysaur'),
      raid_boss: [{ id: 1, pokemon_id: 2, name: 'Ivysaur', form: '', tier: '3' }],
    } as unknown as PokemonVariant;

    expect(hasHydratedMoves([withMoves])).toBe(true);
    expect(hasHydratedRaidData([withMoves])).toBe(false);
    expect(hasHydratedRaidData([withRaidHistory])).toBe(true);
  });
});
