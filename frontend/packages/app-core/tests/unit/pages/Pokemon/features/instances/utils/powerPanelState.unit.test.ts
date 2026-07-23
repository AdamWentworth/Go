import { describe, expect, it } from 'vitest';

import { resolvePowerPanelState } from '@/pages/Pokemon/features/instances/utils/powerPanelState';
import type { CrownForm, MegaEvolution } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

const maxForms = [
  {
    pokemon_id: 25,
    dynamax: true,
    gigantamax: false,
    dynamax_release_date: null,
    gigantamax_release_date: null,
  },
] as PokemonVariant['max'];

const megaEvolutions = [
  {
    id: 25,
    form: 'X',
    mega_energy_cost: 200,
    type1_name: 'Electric',
    type_1_id: 13,
  },
] as MegaEvolution[];

const crownForms = [
  {
    form: 'royal',
    display_form: 'Royal',
    crown_pokemon_id: 25,
    type1_name: 'Electric',
  },
] as CrownForm[];

describe('resolvePowerPanelState', () => {
  it('normalizes partial mega data and enables all eligible power controls', () => {
    expect(
      resolvePowerPanelState({
        pokemon: {
          pokemon_id: 25,
          variantType: 'shiny_dynamax',
          max: maxForms,
          instanceData: { shadow: false, purified: false },
        },
        editMode: true,
        megaData: { isMega: true },
        megaEvolutions,
        crownForms,
        isShadow: false,
        name: 'Pikachu',
      }),
    ).toMatchObject({
      normalizedMegaData: { isMega: true, mega: false, megaForm: null },
      hasMaxVariant: true,
      canRenderMax: true,
      canRenderMega: true,
      canRenderCrown: true,
      isShiny: true,
      renderedPowerCount: 3,
    });
  });

  it('applies max, mega, and crown restrictions independently', () => {
    expect(
      resolvePowerPanelState({
        pokemon: {
          variantType: 'costume_dynamax',
          max: maxForms,
          instanceData: { purified: true },
        },
        editMode: true,
        megaData: {},
        megaEvolutions,
        crownForms,
        isShadow: true,
        name: 'Clone Charizard',
      }),
    ).toMatchObject({
      canRenderMax: false,
      canRenderMega: false,
      canRenderCrown: false,
      renderedPowerCount: 0,
    });
  });

  it('treats instance shiny state as shiny even when the variant type is plain', () => {
    expect(
      resolvePowerPanelState({
        pokemon: {
          variantType: 'default',
          instanceData: { shiny: true },
        },
        editMode: false,
        megaData: {},
        isShadow: false,
        name: 'Pikachu',
      }).isShiny,
    ).toBe(true);
  });

  it.each([
    {
      name: 'Crowned Sword Zacian',
      pokemonId: 888,
      variantType: 'default' as const,
      crownForm: 'Crowned Sword',
    },
    {
      name: 'legacy Crowned Shield Zamazenta',
      pokemonId: 2292,
      variantType: 'shiny' as const,
      crownForm: 'Crowned Shield',
    },
  ])('enables Max Move upgrades for $name without catalog Max rows', ({
    pokemonId,
    variantType,
    crownForm,
  }) => {
    expect(
      resolvePowerPanelState({
        pokemon: {
          pokemon_id: pokemonId,
          variantType,
          max: [],
        },
        editMode: true,
        crownData: { isCrown: true, crownForm },
        isShadow: false,
        name: 'Pokemon',
      }),
    ).toMatchObject({
      hasMaxVariant: false,
      hasCatalogMaxAccess: false,
      hasSpecialMaxAccess: true,
      canRenderMax: true,
    });
  });

  it('does not expose Max Move upgrades for Hero Zacian', () => {
    expect(
      resolvePowerPanelState({
        pokemon: {
          pokemon_id: 888,
          variantType: 'default',
          form: 'Hero of Many Battles',
          max: [],
        },
        editMode: true,
        crownData: { isCrown: false, crownForm: 'Crowned Sword' },
        isShadow: false,
        name: 'Zacian',
      }).canRenderMax,
    ).toBe(false);
  });

  it('enables Max Move upgrades for Eternatus', () => {
    expect(
      resolvePowerPanelState({
        pokemon: {
          pokemon_id: 890,
          variantType: 'default',
          max: [],
        },
        editMode: true,
        isShadow: false,
        name: 'Eternatus',
      }),
    ).toMatchObject({
      hasSpecialMaxAccess: true,
      canRenderMax: true,
    });
  });
});
