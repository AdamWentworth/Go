import { describe, expect, it } from 'vitest';

import {
  collectInstanceRefCandidates,
  findInstanceByRefs,
  getPokemonCardCpValue,
  getPokemonCardDisplayName,
  getPokemonCardHighlightKey,
  getPokemonCardOwnershipClass,
  parseBackgroundId,
  resolvePokemonCardActiveFusionEntry,
  resolvePokemonCardActiveMegaEvolution,
  resolvePokemonCardLocationBackground,
  resolvePokemonCardTypeData,
  shouldDisplayPokemonCardLuckyBackdrop,
  type PokemonCardPokemon,
} from '@/pages/Pokemon/components/Menus/PokemonMenu/pokemonCardState';
import type { ResolveFusionBackgroundPoolResult } from '@/pages/Pokemon/features/instances/utils/resolveFusionBackgroundPool';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { CrownForm, Fusion, MegaEvolution, VariantBackground } from '@/types/pokemonSubTypes';

const makePokemon = (overrides: Partial<PokemonCardPokemon> = {}): PokemonCardPokemon =>
  ({
    pokemon_id: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    variant_id: '0001-default',
    variantType: 'default',
    currentImage: '/images/1.png',
    pokedex_number: 1,
    cp50: 1115,
    type1_name: 'Grass',
    type2_name: 'Poison',
    type_1_icon: '/images/types/grass.png',
    type_2_icon: '/images/types/poison.png',
    backgrounds: [],
    fusion: [],
    megaEvolutions: [],
    instanceData: {},
    ...overrides,
  }) as unknown as PokemonCardPokemon;

const makeInstance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance =>
  ({
    instance_id: 'instance-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    location_card: null,
    ...overrides,
  }) as PokemonInstance;

const makeBackground = (background_id: number, image_url = `/bg-${background_id}.png`): VariantBackground => ({
  background_id,
  image_url,
  name: `Background ${background_id}`,
  costume_id: 0,
  date: '',
  location: '',
});

const makeFusion = (overrides: Partial<Fusion> = {}): Fusion =>
  ({
    fusion_id: 1,
    name: 'Test Fusion',
    base_pokemon_id1: 1,
    base_pokemon_id2: 2,
    type_1_id: 3,
    type_2_id: 12,
    type1_name: 'Dragon',
    type2_name: 'Ice',
    date_available: '2025-01-01',
    backgrounds: [],
    background_combo_rules: [],
    ...overrides,
  }) as Fusion;

const makeMega = (overrides: Partial<MegaEvolution> = {}): MegaEvolution =>
  ({
    id: 1,
    form: 'X',
    date_available: '2020-01-01',
    mega_energy_cost: 200,
    type_1_id: 10,
    type_2_id: 3,
    type1_name: 'Fire',
    type2_name: 'Dragon',
    ...overrides,
  }) as MegaEvolution;

const makeCrown = (overrides: Partial<CrownForm> = {}): CrownForm =>
  ({
    id: 1,
    base_pokemon_id: 1,
    crown_pokemon_id: 1,
    display_form: 'King',
    name: 'King Bulbasaur',
    type_1_id: 13,
    type1_name: 'Psychic',
    ...overrides,
  }) as CrownForm;

const emptyFusionBackgrounds: ResolveFusionBackgroundPoolResult = {
  backgrounds: [],
  source: 'base',
  fusionId: null,
};

describe('pokemonCardState', () => {
  it('collects instance reference candidates from legacy keys and UUID-suffixed values', () => {
    const uuid = '99999999-9999-4999-8999-999999999999';

    expect(collectInstanceRefCandidates(`fusion_${uuid}`)).toEqual([
      `fusion_${uuid}`,
      uuid,
    ]);
    expect(collectInstanceRefCandidates('variant_legacy-key')).toEqual([
      'variant_legacy-key',
      'legacy-key',
    ]);
    expect(collectInstanceRefCandidates(null)).toEqual([]);
  });

  it('finds referenced instances by collection key or row instance_id', () => {
    const rowByKey = makeInstance({ instance_id: 'row-key' });
    const rowByInstanceId = makeInstance({ instance_id: 'linked-instance' });

    expect(
      findInstanceByRefs(
        {
          'variant_key-ref': rowByKey,
          unrelated: rowByInstanceId,
        },
        ['key-ref'],
      ),
    ).toBe(rowByKey);

    expect(
      findInstanceByRefs(
        {
          unrelated: rowByInstanceId,
        },
        ['linked-instance'],
      ),
    ).toBe(rowByInstanceId);
  });

  it('parses background ids from numeric and string values', () => {
    expect(parseBackgroundId(19)).toBe(19);
    expect(parseBackgroundId('19')).toBe(19);
    expect(parseBackgroundId('')).toBeNull();
    expect(parseBackgroundId('abc')).toBeNull();
  });

  it('resolves active mega and fusion entries by normalized form and stored ids', () => {
    const megaX = makeMega({ form: 'X', type1_name: 'Fire' });
    const megaY = makeMega({ id: 2, form: 'Mega Y', type1_name: 'Flying' });
    expect(
      resolvePokemonCardActiveMegaEvolution({
        isMega: true,
        megaForm: 'mega-y',
        megaEvolutions: [megaX, megaY],
      }),
    ).toBe(megaY);

    const fusionOne = makeFusion({ fusion_id: 1, name: 'Dusk Mane Necrozma' });
    const fusionTwo = makeFusion({ fusion_id: 2, name: 'Dawn Wings Necrozma' });
    expect(
      resolvePokemonCardActiveFusionEntry({
        isFused: true,
        fusionEntries: [fusionOne, fusionTwo],
        storedFusion: { fusion_id: '2' },
      }),
    ).toBe(fusionTwo);
  });

  it('resolves type display data for base, mega, fusion, and crown cards', () => {
    expect(
      resolvePokemonCardTypeData({
        pokemon: makePokemon({ type_1_icon: '', type_2_icon: '' }),
      }),
    ).toEqual({
      type1_name: 'Grass',
      type2_name: 'Poison',
      type_1_icon: '/images/types/grass.png',
      type_2_icon: '/images/types/poison.png',
    });

    expect(
      resolvePokemonCardTypeData({
        pokemon: makePokemon({ type1_name: 'Steel', type2_name: 'Rock' }),
        isMega: true,
        activeMegaEvolution: makeMega({
          form: null,
          type1_name: 'Steel',
          type2_name: undefined,
          type_2_id: undefined,
        }),
      }),
    ).toEqual({
      type1_name: 'Steel',
      type2_name: undefined,
      type_1_icon: '/images/types/steel.png',
      type_2_icon: undefined,
    });

    expect(
      resolvePokemonCardTypeData({
        pokemon: makePokemon(),
        isFused: true,
        activeFusionEntry: makeFusion({ type1_name: 'Dragon', type2_name: 'Ice' }),
      }),
    ).toMatchObject({
      type1_name: 'Dragon',
      type2_name: 'Ice',
      type_1_icon: '/images/types/dragon.png',
      type_2_icon: '/images/types/ice.png',
    });

    expect(
      resolvePokemonCardTypeData({
        pokemon: makePokemon(),
        isCrown: true,
        activeCrownForm: makeCrown({ type1_name: 'Psychic', type2_name: 'Water' }),
      }),
    ).toMatchObject({
      type1_name: 'Psychic',
      type2_name: 'Water',
      type_1_icon: '/images/types/psychic.png',
      type_2_icon: '/images/types/water.png',
    });
  });

  it('builds display names with nickname, fusion, mega, and crown precedence', () => {
    expect(
      getPokemonCardDisplayName({
        pokemon: makePokemon({ instanceData: { nickname: 'Sprout' } }),
      }),
    ).toBe('Sprout');

    expect(
      getPokemonCardDisplayName({
        pokemon: makePokemon({ instanceData: { shiny: true } }),
        isFused: true,
        fusionForm: 'Dawn Wings Necrozma',
      }),
    ).toBe('Shiny Dawn Wings Necrozma');

    expect(
      getPokemonCardDisplayName({
        pokemon: makePokemon({
          name: 'Shiny Charizard',
          variantType: 'shiny',
          instanceData: { shiny: true },
        }),
        isMega: true,
        megaForm: 'X',
      }),
    ).toBe('Shiny Mega Charizard X');

    expect(
      getPokemonCardDisplayName({
        pokemon: makePokemon({ name: 'Shiny Bulbasaur', variantType: 'shiny' }),
        isCrown: true,
        activeCrownForm: makeCrown({ display_form: 'King' }),
      }),
    ).toBe('Shiny King Bulbasaur');
  });

  it('resolves highlight keys, ownership classes, lucky backdrop, and CP values', () => {
    expect(
      getPokemonCardHighlightKey(
        makePokemon({ variant_id: '0001-default', instanceData: { instance_id: 'owned-1' } }),
      ),
    ).toBe('owned-1');
    expect(getPokemonCardHighlightKey(makePokemon({ instanceData: {} }))).toBe('0001-default');

    expect(getPokemonCardOwnershipClass('Caught')).toBe('caught');
    expect(getPokemonCardOwnershipClass('unknown')).toBe('');

    expect(
      shouldDisplayPokemonCardLuckyBackdrop('wanted', { pref_lucky: true }),
    ).toBe(true);
    expect(shouldDisplayPokemonCardLuckyBackdrop('caught', { lucky: true })).toBe(true);
    expect(shouldDisplayPokemonCardLuckyBackdrop('caught', { pref_lucky: true })).toBe(false);

    expect(
      getPokemonCardCpValue({
        tagFilter: 'caught',
        sortType: 'name',
        pokemon: makePokemon({ instanceData: { cp: 42 } }),
      }),
    ).toBe(42);
    expect(
      getPokemonCardCpValue({
        tagFilter: '',
        sortType: 'combatPower',
        pokemon: makePokemon({ cp50: 1115 }),
      }),
    ).toBe(1115);
    expect(
      getPokemonCardCpValue({
        tagFilter: '',
        sortType: 'name',
        pokemon: makePokemon({ cp50: 1115 }),
      }),
    ).toBe('');
  });

  it('resolves location backgrounds from variant fallbacks and fusion combo rules', () => {
    const fallbackBackground = makeBackground(7);
    expect(
      resolvePokemonCardLocationBackground({
        pokemon: makePokemon({
          pokemon_id: 25,
          backgrounds: [],
          instanceData: { location_card: '7' },
        }),
        variantByPokemonId: new Map([[25, { backgrounds: [fallbackBackground] }]]),
        resolvedFusionBackgrounds: emptyFusionBackgrounds,
        isFused: false,
      }),
    ).toBe(fallbackBackground);

    const ownBackground = makeBackground(1);
    const comboBackground = makeBackground(3);
    expect(
      resolvePokemonCardLocationBackground({
        pokemon: makePokemon({
          pokemon_id: 1,
          fusion: [
            makeFusion({
              fusion_id: 1,
              base_pokemon_id1: 1,
              base_pokemon_id2: 2,
              background_combo_rules: [
                {
                  member1_background_id: 1,
                  member2_background_id: 2,
                  combo_background_id: 3,
                },
              ],
            }),
          ],
          instanceData: { location_card: '1' },
        }),
        variantByPokemonId: new Map(),
        resolvedFusionBackgrounds: {
          backgrounds: [ownBackground, comboBackground],
          source: 'fusion',
          fusionId: 1,
        },
        isFused: true,
        fusedPartnerInstance: makeInstance({ location_card: '2' }),
        fusionForm: 'Test Fusion',
      }),
    ).toBe(comboBackground);
  });
});
