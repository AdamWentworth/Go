import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCaughtInstanceSectionVisibility } from '@/pages/Pokemon/features/instances/hooks/useCaughtInstanceSectionVisibility';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

type CaughtPokemon = PokemonVariant & { instanceData?: PokemonInstance };

const pokemon = (overrides: Partial<CaughtPokemon> = {}): CaughtPokemon =>
  ({
    pokemon_id: 25,
    variant_id: '0025-default',
    variantType: 'default',
    currentImage: '/images/pikachu.png',
    species_name: 'Pikachu',
    name: 'Pikachu',
    fusion: [],
    max: [],
    instanceData: {
      instance_id: 'instance-25',
      pokemon_id: 25,
      variant_id: '0025-default',
    },
    ...overrides,
  }) as CaughtPokemon;

const renderVisibility = (
  overrides: Partial<Parameters<typeof useCaughtInstanceSectionVisibility>[0]> = {},
) => {
  const basePokemon = pokemon();
  return renderHook(() =>
    useCaughtInstanceSectionVisibility({
      pokemon: basePokemon,
      movesPokemon: basePokemon,
      megaEvolutionCount: 0,
      crownFormCount: 0,
      isCrowned: false,
      pokemonName: 'Pikachu',
      variantType: 'default',
      maxCount: 0,
      editMode: false,
      isShadow: false,
      isPurified: false,
      isFused: false,
      fusionMoveSource: 'base',
      areIVsEmpty: true,
      isTraded: false,
      originalTrainerName: null,
      tradedDate: null,
      pokeball: null,
      ...overrides,
    }),
  );
};

describe('useCaughtInstanceSectionVisibility', () => {
  it('hides optional sections and adds the stats gap for an empty read-only instance', () => {
    const { result } = renderVisibility();

    expect(result.current).toMatchObject({
      fusionOptionCount: 0,
      showPowerSectionDivider: false,
      movesAndIVVisible: false,
      metaPanelVisible: false,
      showStatsDivider: false,
      showMetaDivider: false,
      addStatsBottomGap: true,
    });
  });

  it('shows edit sections and dividers for editable max-capable instances', () => {
    const { result } = renderVisibility({
      pokemon: pokemon({ variantType: 'dynamax', max: [{}] as CaughtPokemon['max'] }),
      movesPokemon: pokemon(),
      variantType: 'dynamax',
      maxCount: 1,
      editMode: true,
    });

    expect(result.current).toMatchObject({
      showPowerSectionDivider: true,
      movesAndIVVisible: true,
      metaPanelVisible: true,
      showStatsDivider: true,
      showMetaDivider: true,
      addStatsBottomGap: false,
    });
  });

  it('shows fusion power and move sections for fused instances with missing fusion moves', () => {
    const fusedPokemon = pokemon({
      fusion: [
        {
          base_pokemon_id1: 25,
          fusion_id: 10,
        },
      ] as CaughtPokemon['fusion'],
    });

    const { result } = renderVisibility({
      pokemon: fusedPokemon,
      movesPokemon: fusedPokemon,
      isFused: true,
      fusionMoveSource: 'fusion_missing',
    });

    expect(result.current).toMatchObject({
      fusionOptionCount: 1,
      showPowerSectionDivider: true,
      movesAndIVVisible: true,
      metaPanelVisible: false,
      showStatsDivider: true,
      showMetaDivider: false,
      addStatsBottomGap: false,
    });
  });

  it('shows the editable power section for Eternatus without catalog Max rows', () => {
    const eternatus = pokemon({
      pokemon_id: 890,
      variant_id: '0890-default',
      name: 'Eternatus',
      species_name: 'Eternatus',
    });
    const { result } = renderVisibility({
      pokemon: eternatus,
      movesPokemon: eternatus,
      pokemonName: 'Eternatus',
      editMode: true,
    });

    expect(result.current.showPowerSectionDivider).toBe(true);
  });
});
