import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCaughtInstanceDisplayData } from '@/pages/Pokemon/features/instances/hooks/useCaughtInstanceDisplayData';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { CrownForm, Fusion, MegaEvolution } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

const sizes = { pokedex_height: 1, pokedex_weight: 10 };
const megaSizes = { pokedex_height: 2, pokedex_weight: 20 };
const crownSizes = { pokedex_height: 3, pokedex_weight: 30 };

const move = (move_id: number, name: string, is_fast = 1) =>
  ({
    move_id,
    name,
    type_id: 10,
    type: 'fire',
    type_name: 'Fire',
    is_fast,
    raid_power: 1,
    pvp_power: 1,
    raid_energy: 1,
    pvp_energy: 1,
    raid_cooldown: 1,
    pvp_turns: 1,
    legacy: false,
    fusion_id: null,
    shadow: null,
    purified: null,
    apex: null,
  }) as NonNullable<PokemonVariant['moves']>[number];

const basePokemon = (overrides: Partial<PokemonVariant> = {}) =>
  ({
    pokemon_id: 25,
    variant_id: '0025-default',
    variantType: 'default',
    name: 'Pikachu',
    species_name: 'Pikachu',
    type1_name: 'Electric',
    type2_name: undefined,
    type_1_icon: '/images/types/electric.png',
    type_2_icon: undefined,
    sizes,
    moves: [move(1, 'Thunder Shock'), move(2, 'Thunderbolt', 0)],
    fusion: [],
    megaEvolutions: [],
    crownForms: [],
    instanceData: {
      instance_id: 'instance-25',
      pokemon_id: 25,
      variant_id: '0025-default',
    },
    ...overrides,
  }) as unknown as PokemonVariant & { instanceData: PokemonInstance };

describe('useCaughtInstanceDisplayData', () => {
  it('assembles crown display and crown moves after mega display when not fused', () => {
    const crownMove = move(30, 'Crown Blast', 0);
    const pokemon = basePokemon({
      megaEvolutions: [
        {
          id: 1,
          form: 'X',
          mega_energy_cost: 200,
          type1_name: 'Fire',
          type2_name: 'Dragon',
          type_1_id: 10,
          type_2_id: 3,
          attack: 1,
          defense: 1,
          stamina: 1,
        } as MegaEvolution,
      ],
      crownForms: [
        {
          form: 'royal',
          display_form: 'Royal',
          crown_pokemon_id: 999,
          type1_name: 'Fairy',
          type2_name: 'Steel',
          moves: [crownMove],
        } as CrownForm,
      ],
    });
    const variants = [
      {
        pokemon_id: 25,
        variantType: 'mega_x',
        megaForm: 'X',
        type1_name: 'Fire',
        type2_name: 'Dragon',
        type_1_icon: '/images/types/fire.png',
        type_2_icon: '/images/types/dragon.png',
        sizes: megaSizes,
      },
      {
        pokemon_id: 999,
        variantType: 'default',
        type1_name: 'Fairy',
        type2_name: 'Steel',
        type_1_icon: '/images/types/fairy.png',
        type_2_icon: '/images/types/steel.png',
        sizes: crownSizes,
      },
    ] as PokemonVariant[];

    const { result } = renderHook(() =>
      useCaughtInstanceDisplayData({
        pokemon,
        variants,
        fusion: {
          is_fused: false,
          fusion_form: null,
          storedFusionObject: null,
        },
        megaData: { isMega: true, mega: true, megaForm: 'X' },
        crownData: { isCrown: true, crownForm: 'Royal' },
        moves: { fastMove: 7, chargedMove1: 8, chargedMove2: 9 },
      }),
    );

    expect(result.current.resolvedFusionMoves.source).toBe('base');
    expect(result.current.resolvedMegaDisplay.source).toBe('mega');
    expect(result.current.resolvedCrownDisplay.source).toBe('crown');
    expect(result.current.statsPokemon.type1_name).toBe('Fairy');
    expect(result.current.statsPokemon.type2_name).toBe('Steel');
    expect(result.current.statsPokemon.sizes).toEqual(crownSizes);
    expect(result.current.movesPokemon.moves?.map((entry) => entry.name)).toEqual([
      'Crown Blast',
    ]);
    expect(result.current.movesPokemon.instanceData).toMatchObject({
      crown: true,
      is_fused: false,
      fast_move_id: 7,
      charged_move1_id: 8,
      charged_move2_id: 9,
    });
    expect(result.current.fusionMoveMeta).toEqual({
      source: 'base',
      isFused: false,
    });
  });

  it('uses fusion display and resolved fusion moves while disabling mega and crown display when fused', () => {
    const fusionMove = move(40, 'Moongeist Beam', 0);
    const pokemon = basePokemon({
      fusion: [
        {
          fusion_id: 1,
          name: 'Dawn Wings',
          type1_name: 'Ghost',
          type2_name: 'Psychic',
          moves: [fusionMove],
        } as Fusion,
      ],
      megaEvolutions: [
        {
          id: 1,
          form: 'X',
          mega_energy_cost: 200,
          type1_name: 'Fire',
          type2_name: 'Dragon',
          type_1_id: 10,
          type_2_id: 3,
          attack: 1,
          defense: 1,
          stamina: 1,
        } as MegaEvolution,
      ],
      crownForms: [
        {
          form: 'royal',
          display_form: 'Royal',
          crown_pokemon_id: 999,
          type1_name: 'Fairy',
        } as CrownForm,
      ],
    });

    const { result } = renderHook(() =>
      useCaughtInstanceDisplayData({
        pokemon,
        variants: [],
        fusion: {
          is_fused: true,
          fusion_form: 'Dawn Wings',
          storedFusionObject: null,
        },
        megaData: { isMega: true, mega: true, megaForm: 'X' },
        crownData: { isCrown: true, crownForm: 'Royal' },
        moves: { fastMove: 40, chargedMove1: null, chargedMove2: null },
      }),
    );

    expect(result.current.resolvedFusionMoves.source).toBe('fusion');
    expect(result.current.resolvedFusionDisplay.source).toBe('fusion');
    expect(result.current.resolvedMegaDisplay.source).toBe('base');
    expect(result.current.resolvedCrownDisplay.source).toBe('base');
    expect(result.current.statsPokemon.type1_name).toBe('Ghost');
    expect(result.current.statsPokemon.type2_name).toBe('Psychic');
    expect(result.current.movesPokemon.moves?.map((entry) => entry.name)).toEqual([
      'Thunder Shock',
      'Thunderbolt',
      'Moongeist Beam',
    ]);
    expect(result.current.fusionMoveMeta).toEqual({
      source: 'fusion',
      isFused: true,
    });
  });
});
