import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { CustomTagsEnvelope } from '@pokemongonexus/shared-contracts/users';
import {
  buildNativeCatalogRows,
  buildNativeCollectionRows,
  buildNativeInstanceDetail,
  buildNativeTagSummaries,
  filterNativeCollectionRows,
  resolveNativeInstanceImage,
  sortNativeCollectionRows,
} from '../../../../src/features/collection/collectionModel';

const instance = (patch: Partial<PokemonInstance>): PokemonInstance => ({
  pokemon_id: 6,
  instance_id: 'instance-1',
  variant_id: '6',
  nickname: null,
  cp: null,
  level: null,
  attack_iv: null,
  defense_iv: null,
  stamina_iv: null,
  shiny: false,
  costume_id: null,
  lucky: false,
  shadow: false,
  purified: false,
  fast_move_id: null,
  charged_move1_id: null,
  charged_move2_id: null,
  weight: null,
  height: null,
  gender: null,
  mega: false,
  mega_form: null,
  is_mega: false,
  dynamax: false,
  gigantamax: false,
  crown: false,
  max_attack: null,
  max_guard: null,
  max_spirit: null,
  is_fused: false,
  fusion: null,
  fusion_form: null,
  fused_with: null,
  is_traded: false,
  traded_date: null,
  original_trainer_id: null,
  original_trainer_name: null,
  is_caught: true,
  is_for_trade: false,
  is_wanted: false,
  most_wanted: false,
  caught_tags: null,
  trade_tags: null,
  wanted_tags: null,
  not_trade_list: null,
  not_wanted_list: null,
  trade_filters: null,
  wanted_filters: null,
  mirror: false,
  pref_lucky: false,
  friendship_level: null,
  registered: true,
  favorite: false,
  disabled: false,
  pokeball: null,
  location_card: null,
  location_caught: null,
  date_caught: null,
  date_added: '2026-08-23T00:00:00Z',
  last_update: 1,
  ...patch,
});

const pokemon = {
  pokemon_id: 6,
  name: 'Charizard',
  pokedex_number: 6,
  image_url: '/images/charizard.png',
  image_url_shiny: '/images/charizard-shiny.png',
  image_url_shadow: '/images/charizard-shadow.png',
  image_url_shiny_shadow: '/images/charizard-shiny-shadow.png',
  costumes: [],
  megaEvolutions: [],
  fusion: [],
  max: [{
    pokemon_id: 6,
    dynamax: true,
    gigantamax: true,
    dynamax_release_date: null,
    gigantamax_release_date: null,
    gigantamax_image_url: '/images/gmax-charizard.png',
    shiny_gigantamax_image_url: '/images/gmax-charizard-shiny.png',
  }],
} as unknown as BasePokemon;

describe('native collection model', () => {
  it('builds the complete catalog separately from collection instances', () => {
    const rows = buildNativeCatalogRows([
      {
        ...pokemon,
        shiny_available: 1,
        date_shadow_available: '2020-01-01',
        date_shiny_shadow_available: '2020-01-01',
      } as BasePokemon,
    ], 'https://pokegonexus.com');

    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: '0006-default', name: 'Charizard', source: 'catalog' }),
      expect.objectContaining({ id: '0006-shiny', name: 'Shiny Charizard' }),
      expect.objectContaining({ id: '0006-shadow', name: 'Shadow Charizard' }),
      expect.objectContaining({ id: '0006-shiny_shadow', name: 'Shiny Shadow Charizard' }),
      expect.objectContaining({ id: '0006-gigantamax', maxKind: 'gigantamax' }),
    ]));
  });

  it('uses the exact shiny Gigantamax artwork when that form is selected', () => {
    expect(resolveNativeInstanceImage(
      instance({ shiny: true, gigantamax: true }),
      pokemon,
    )).toBe('/images/gmax-charizard-shiny.png');
  });

  it('builds stable rows, excludes disabled data, and resolves relative artwork', () => {
    const rows = buildNativeCollectionRows({
      caught: instance({ instance_id: 'caught', favorite: true }),
      wanted: instance({ instance_id: 'wanted', is_caught: false, is_wanted: true, most_wanted: true }),
      disabled: instance({ instance_id: 'disabled', disabled: true }),
    }, [pokemon], 'https://pokegonexus.com');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(expect.objectContaining({
      name: 'Charizard',
      imageUri: 'https://pokegonexus.com/images/charizard.png',
      favorite: true,
    }));
    expect(filterNativeCollectionRows(rows, 'wanted', '')).toEqual([
      expect.objectContaining({ id: 'wanted', mostWanted: true }),
    ]);
    expect(filterNativeCollectionRows(rows, 'favorites', '')).toEqual([
      expect.objectContaining({ id: 'caught', favorite: true }),
    ]);
    expect(filterNativeCollectionRows(rows, 'most-wanted', '')).toEqual([
      expect.objectContaining({ id: 'wanted', mostWanted: true }),
    ]);
    expect(filterNativeCollectionRows(rows, 'all', '0006')).toHaveLength(0);
    expect(filterNativeCollectionRows(rows, 'all', '6')).toHaveLength(2);
  });

  it('preserves costume names, type icons, and the costume-specific location background', () => {
    const presentationPokemon = {
      ...pokemon,
      type_1_icon: '/images/types/fire.png',
      type_2_icon: '/images/types/flying.png',
      costumes: [{
        costume_id: 22,
        name: 'detective_hat',
        image_url: '/images/detective-charizard.png',
        image_url_shiny: '/images/shiny-detective-charizard.png',
      }],
      backgrounds: [
        { background_id: 9, costume_id: null, image_url: '/images/generic-location.png' },
        { background_id: 9, costume_id: 22, image_url: '/images/detective-location.png' },
      ],
    } as unknown as BasePokemon;

    const rows = buildNativeCollectionRows({
      detective: instance({
        instance_id: 'detective',
        shiny: true,
        costume_id: 22,
        location_card: '9',
      }),
    }, [presentationPokemon], 'https://pokegonexus.com');

    expect(rows[0]).toEqual(expect.objectContaining({
      name: 'Shiny Detective Hat Charizard',
      imageUri: 'https://pokegonexus.com/images/shiny-detective-charizard.png',
      locationBackgroundUri: 'https://pokegonexus.com/images/detective-location.png',
      typeIconUris: [
        'https://pokegonexus.com/images/types/fire.png',
        'https://pokegonexus.com/images/types/flying.png',
      ],
    }));
  });

  it('sorts a copy of real collection rows without mutating query data', () => {
    const rows = buildNativeCollectionRows({
      charizard: instance({ instance_id: 'charizard', cp: 2500, favorite: false }),
      favorite: instance({ instance_id: 'favorite', nickname: 'Ace', cp: 1500, favorite: true }),
    }, [pokemon], 'https://pokegonexus.com');
    const originalOrder = rows.map((row) => row.id);

    expect(sortNativeCollectionRows(rows, 'name', 'ascending').map((row) => row.id)).toEqual([
      'favorite',
      'charizard',
    ]);
    expect(sortNativeCollectionRows(rows, 'cp', 'descending').map((row) => row.id)).toEqual([
      'charizard',
      'favorite',
    ]);
    expect(sortNativeCollectionRows(rows, 'favorite', 'descending')[0].id).toBe('favorite');
    expect(rows.map((row) => row.id)).toEqual(originalOrder);
  });

  it('derives ordered system and custom tag membership from canonical instances', () => {
    const instances = {
      favorite: instance({
        instance_id: 'favorite',
        favorite: true,
        caught_tags: ['purple-tag'],
      }),
      trade: instance({
        instance_id: 'trade',
        is_for_trade: true,
        caught_tags: ['purple-tag'],
      }),
      wanted: instance({
        instance_id: 'wanted',
        is_caught: false,
        is_wanted: true,
        most_wanted: true,
        wanted_tags: ['dream-tag'],
      }),
    };
    const rows = buildNativeCollectionRows(instances, [pokemon], 'https://pokegonexus.com');
    const envelope: CustomTagsEnvelope = {
      tags: [
        { tag_id: 'purple-tag', parent: 'caught' as const, name: 'Shadow Shinies', color: '#7c3aed', sort: 0, created_at: 'now' },
        { tag_id: 'dream-tag', parent: 'wanted' as const, name: 'Dream Trades', color: '#f43f5e', sort: 0, created_at: 'now' },
      ],
      orders: {
        caught: ['system:favorites', 'custom:purple-tag', 'system:caught', 'system:trade'],
        wanted: ['custom:dream-tag', 'system:most-wanted', 'system:wanted'],
      },
    };

    const caught = buildNativeTagSummaries(rows, instances, envelope, 'caught');
    const wanted = buildNativeTagSummaries(rows, instances, envelope, 'wanted');

    expect(caught.map((tag) => tag.name)).toEqual([
      'Favorites', 'Shadow Shinies', 'All Caught', 'For Trade',
    ]);
    expect(caught.find((tag) => tag.name === 'Shadow Shinies')?.rows).toHaveLength(2);
    expect(wanted.map((tag) => tag.name)).toEqual([
      'Dream Trades', 'Most Wanted', 'All Wanted',
    ]);
    expect(wanted[0].rows[0]).toEqual(expect.objectContaining({ id: 'wanted' }));
  });

  it('builds a native detail model from shared instance identity and move metadata', () => {
    const detail = buildNativeInstanceDetail(
      {
        legacy_key: instance({
          instance_id: 'instance-1',
          shiny: true,
          cp: 2499,
          attack_iv: 15,
          friendship_level: 5,
          pref_lucky: true,
          fast_move_id: 101,
        }),
      },
      [pokemon],
      [{
        pokemon_id: 6,
        moves: [{ move_id: 101, name: 'Fire Spin' }],
        fusion: [],
        crownForms: [],
      }] as never,
      'instance-1',
      'https://pokegonexus.com',
    );

    expect(detail).toEqual(expect.objectContaining({
      row: expect.objectContaining({ name: 'Shiny Charizard' }),
      traits: expect.arrayContaining(['Shiny']),
      stats: expect.arrayContaining([{ label: 'CP', value: '2,499' }]),
      ivs: [{ label: 'Attack', value: 15 }],
      moves: [{ label: 'Fast move', value: 'Fire Spin' }],
      preferences: expect.arrayContaining([
        { label: 'Friendship', value: '5/5 hearts' },
        { label: 'Lucky trade', value: 'Requested' },
      ]),
    }));
  });
});
