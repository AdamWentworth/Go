import { describe, expect, it } from 'vitest';
import { determineVariantId, parseVariantId } from '@/utils/PokemonIDUtils';
import type { PokemonVariant } from '@/types/pokemonVariants';

function makeVariant(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    pokemon_id: 25,
    variant_id: '0025-default',
    variantType: 'default',
    currentImage: 'default.png',
    image_url: 'default.png',
    image_url_shadow: 'shadow.png',
    image_url_shiny: 'shiny.png',
    image_url_shiny_shadow: 'shiny-shadow.png',
    costumes: [],
    ...overrides,
  } as unknown as PokemonVariant;
}

describe('PokemonIDUtils', () => {
  it('returns costume default variant when current image matches costume image', () => {
    const variant = makeVariant({
      currentImage: 'costume-default.png',
      costumes: [
        {
          costume_id: 11,
          date_available: '',
          date_shiny_available: null,
          name: 'party_hat',
          image_url: 'costume-default.png',
          image_url_shiny: 'costume-shiny.png',
          shiny_available: 1,
        },
      ],
    });

    expect(determineVariantId(variant)).toBe('0025-party_hat_default');
  });

  it('returns explicit variantType suffix for mega/fusion/max families', () => {
    const megaVariant = makeVariant({
      variantType: 'mega_x',
      currentImage: 'other.png',
    });

    expect(determineVariantId(megaVariant)).toBe('0025-mega_x');
  });

  it('falls back to standard image mapping when no costume or explicit suffix applies', () => {
    const shinyShadowVariant = makeVariant({
      currentImage: 'shiny-shadow.png',
      variantType: 'default',
    });

    expect(determineVariantId(shinyShadowVariant)).toBe('0025-shiny_shadow');
  });

  it('parses variant ids and strips instance uuid when present', () => {
    expect(parseVariantId('0001-default_550e8400-e29b-41d4-a716-446655440000')).toEqual({
      baseKey: '0001-default',
      hasUUID: true,
    });
    expect(parseVariantId('0001-default')).toEqual({
      baseKey: '0001-default',
      hasUUID: false,
    });
  });
});
