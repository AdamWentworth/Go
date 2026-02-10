import { describe, expect, it } from 'vitest';
import { findVariantForInstance } from '@/pages/Search/utils/findVariantForInstance';

describe('findVariantForInstance', () => {
  it('prefers instance.variant_id over keyOrInstanceId', () => {
    const variants: any[] = [
      {
        variant_id: '0001-default',
        pokemon_id: 1,
        variantType: 'default',
      },
      {
        variant_id: '0001-shiny',
        pokemon_id: 1,
        variantType: 'shiny',
      },
    ];

    const result = findVariantForInstance(
      variants,
      '0001-default',
      { variant_id: '0001-shiny', pokemon_id: 1, shiny: true },
    );

    expect(result?.variant_id).toBe('0001-shiny');
  });

  it('falls back to keyOrInstanceId when variant_id is missing', () => {
    const variants: any[] = [
      { variant_id: '0004-default', pokemon_id: 4, variantType: 'default' },
      { variant_id: '0004-shadow', pokemon_id: 4, variantType: 'shadow' },
    ];

    const result = findVariantForInstance(variants, '0004-shadow', {
      pokemon_id: 4,
      shadow: true,
    });

    expect(result?.variant_id).toBe('0004-shadow');
  });

  it('falls back to pokemon traits when no key matches', () => {
    const variants: any[] = [
      { variant_id: '0025-default', pokemon_id: 25, variantType: 'default' },
      { variant_id: '0025-gigantamax', pokemon_id: 25, variantType: 'gigantamax' },
    ];

    const result = findVariantForInstance(variants, 'instance-uuid-key', {
      pokemon_id: 25,
      gigantamax: true,
    });

    expect(result?.variant_id).toBe('0025-gigantamax');
  });
});

