import { describe, expect, it } from 'vitest';

import { resolvePokemonDisplayFusionBackgroundPool } from '@/features/pokemonDisplay/fusionBackgrounds';
import type { Fusion, VariantBackground } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

const buildBackground = (overrides: Partial<VariantBackground>): VariantBackground => ({
  background_id: 1,
  image_url: 'https://example.com/bg-1.png',
  name: 'Base Background',
  costume_id: 0,
  date: '2025-01-01',
  location: 'Anywhere',
  ...overrides,
});

describe('resolvePokemonDisplayFusionBackgroundPool', () => {
  it('returns base backgrounds when not fused', () => {
    const baseBackgrounds = [
      buildBackground({ background_id: 10, name: 'Snow' }),
      buildBackground({ background_id: 11, name: 'Ice Cave' }),
    ];

    const result = resolvePokemonDisplayFusionBackgroundPool({
      pokemon: {
        backgrounds: baseBackgrounds,
        fusion: [],
      } as unknown as Pick<PokemonVariant, 'backgrounds' | 'fusion'>,
      fusion: { is_fused: false },
    });

    expect(result.source).toBe('base');
    expect(result.fusionId).toBeNull();
    expect(result.backgrounds.map((background) => background.name)).toEqual([
      'Snow',
      'Ice Cave',
    ]);
  });

  it('returns fusion-specific backgrounds when fused and fusion backgrounds are present', () => {
    const baseBackgrounds = [buildBackground({ background_id: 10, name: 'Snow' })];
    const fusionBackgrounds = [
      buildBackground({ background_id: 40, name: 'White Combo' }),
      buildBackground({ background_id: 41, name: 'Reshiram Inherited' }),
    ];

    const result = resolvePokemonDisplayFusionBackgroundPool({
      pokemon: {
        backgrounds: baseBackgrounds,
        fusion: [
          {
            fusion_id: 3,
            base_pokemon_id1: 646,
            base_pokemon_id2: 643,
            name: 'White Kyurem',
            backgrounds: fusionBackgrounds,
          } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'backgrounds' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'White Kyurem',
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(3);
    expect(result.backgrounds.map((background) => background.name)).toEqual([
      'White Combo',
      'Reshiram Inherited',
    ]);
    expect(result.backgrounds.some((background) => background.name === 'Snow')).toBe(false);
  });

  it('matches fusion by slug-normalized form and dedupes duplicate background rows', () => {
    const fusionBackgrounds = [
      buildBackground({ background_id: 90, costume_id: 0, name: 'Combo A' }),
      buildBackground({ background_id: 90, costume_id: 0, name: 'Combo A Duplicate' }),
      buildBackground({ background_id: 91, costume_id: 0, name: 'Combo B' }),
    ];

    const result = resolvePokemonDisplayFusionBackgroundPool({
      pokemon: {
        backgrounds: [buildBackground({ background_id: 10, name: 'Base' })],
        fusion: [
          {
            fusion_id: 4,
            base_pokemon_id1: 646,
            base_pokemon_id2: 644,
            name: 'Black Kyurem',
            backgrounds: fusionBackgrounds,
          } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'backgrounds' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'black_kyurem',
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(4);
    expect(result.backgrounds.map((background) => background.background_id)).toEqual([90, 91]);
  });

  it('prefers active fusion_form over historical stored fusion ids', () => {
    const duskManeBackgrounds = [buildBackground({ background_id: 501, name: 'Dusk Mane BG' })];
    const dawnWingsBackgrounds = [buildBackground({ background_id: 502, name: 'Dawn Wings BG' })];

    const result = resolvePokemonDisplayFusionBackgroundPool({
      pokemon: {
        backgrounds: [buildBackground({ background_id: 10, name: 'Base' })],
        fusion: [
          {
            fusion_id: 1,
            base_pokemon_id2: 791,
            name: 'Dusk Mane Necrozma',
            backgrounds: duskManeBackgrounds,
          } as Fusion,
          {
            fusion_id: 2,
            base_pokemon_id2: 792,
            name: 'Dawn Wings Necrozma',
            backgrounds: dawnWingsBackgrounds,
          } as Fusion,
        ],
      } as unknown as Pick<PokemonVariant, 'backgrounds' | 'fusion'>,
      fusion: {
        is_fused: true,
        fusion_form: 'Dawn Wings Necrozma',
        storedFusionObject: { 1: true, 2: true },
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(2);
    expect(result.backgrounds.map((background) => background.name)).toEqual(['Dawn Wings BG']);
  });
});
