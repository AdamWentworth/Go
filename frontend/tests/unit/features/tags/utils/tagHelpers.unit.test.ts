import { describe, expect, it } from 'vitest';
import { buildTagItem, coerceToTagBuckets } from '@/features/tags/utils/tagHelpers';

describe('tagHelpers', () => {
  it('buildTagItem maps core variant and instance fields', () => {
    const item = buildTagItem(
      'inst-1',
      {
        instance_id: 'inst-1',
        pokemon_id: 25,
        cp: 1234,
        shiny: true,
        favorite: true,
        most_wanted: false,
        is_caught: true,
        is_for_trade: true,
        is_wanted: false,
        mirror: false,
        pref_lucky: false,
        registered: true,
        gender: 'Female',
        friendship_level: 2,
        location_card: 'Seattle',
      },
      {
        name: 'Pikachu',
        form: null,
        variantType: 'default',
        currentImage: '/images/default/pokemon_25.png',
        stamina: 111,
        shiny_rarity: 'common',
        rarity: 'common',
        pokedex_number: 25,
        moves: [],
        type1_name: 'Electric',
        type2_name: '',
        type_1_icon: '/images/types/electric.png',
        type_2_icon: '',
      }
    );

    expect(item.instance_id).toBe('inst-1');
    expect(item.pokemon_id).toBe(25);
    expect(item.favorite).toBe(true);
    expect(item.is_for_trade).toBe(true);
    expect(item.name).toBe('Pikachu');
    expect(item.currentImage).toBe('/images/default/pokemon_25.png');
  });

  it('buildTagItem applies safe defaults for missing variant fields', () => {
    const item = buildTagItem(
      'inst-2',
      {
        instance_id: 'inst-2',
        pokemon_id: 1,
        shiny: false,
        is_caught: false,
        is_for_trade: false,
        is_wanted: true,
        favorite: false,
        most_wanted: true,
        mirror: false,
        pref_lucky: false,
        registered: false,
      },
      {}
    );

    expect(item.currentImage).toBe('/images/default_pokemon.png');
    expect(item.type1_name).toBe('Unknown');
    expect(item.type2_name).toBe('');
    expect(item.gender).toBe('Unknown');
  });

  it('coerceToTagBuckets always includes caught and wanted buckets', () => {
    const stubItem = buildTagItem('x-1', {}, {});
    const buckets = coerceToTagBuckets({
      custom: {
        'x-1': stubItem,
      },
    });

    expect(buckets.caught).toEqual({});
    expect(buckets.wanted).toEqual({});
    expect(buckets.custom).toBeDefined();
  });
});
