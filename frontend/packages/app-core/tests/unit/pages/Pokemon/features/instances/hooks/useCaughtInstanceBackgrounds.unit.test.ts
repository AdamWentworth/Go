import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCaughtInstanceBackgrounds } from '@/pages/Pokemon/features/instances/hooks/useCaughtInstanceBackgrounds';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { Fusion, VariantBackground } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

const mocks = vi.hoisted(() => ({
  instances: {} as Record<string, PokemonInstance>,
  foreignInstances: null as Record<string, PokemonInstance> | null,
}));

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: <T,>(
    selector: (state: {
      instances: Record<string, PokemonInstance>;
      foreignInstances: Record<string, PokemonInstance> | null;
    }) => T,
  ) =>
    selector({
      instances: mocks.instances,
      foreignInstances: mocks.foreignInstances,
    }),
}));

const background = (
  background_id: number,
  overrides: Partial<VariantBackground> = {},
): VariantBackground =>
  ({
    background_id,
    image_url: `/images/backgrounds/${background_id}.png`,
    name: `Background ${background_id}`,
    costume_id: 0,
    date: '',
    location: '',
    ...overrides,
  }) as VariantBackground;

const instance = (
  instance_id: string,
  location_card: string | null,
): PokemonInstance =>
  ({
    instance_id,
    pokemon_id: 792,
    variant_id: '0792-default',
    location_card,
  }) as PokemonInstance;

const pokemon = (overrides: Partial<PokemonVariant> = {}): PokemonVariant =>
  ({
    pokemon_id: 25,
    variant_id: '0025-default',
    variantType: 'default',
    currentImage: '/images/pikachu.png',
    species_name: 'Pikachu',
    name: 'Pikachu',
    backgrounds: [],
    fusion: [],
    ...overrides,
  }) as PokemonVariant;

describe('useCaughtInstanceBackgrounds', () => {
  beforeEach(() => {
    mocks.instances = {};
    mocks.foreignInstances = null;
  });

  it('uses the active background pool and falls back to the saved location card when not fused', () => {
    const availablePokemon = pokemon({
      backgrounds: [
        background(1),
        background(2, { costume_id: 7 }),
      ],
    });

    const { result } = renderHook(() =>
      useCaughtInstanceBackgrounds({
        pokemon: availablePokemon,
        variantType: 'default',
        locationCard: '1',
        fusion: {
          is_fused: false,
          fusion_form: null,
          fusedWith: null,
          storedFusionObject: null,
        },
      }),
    );

    expect(result.current.resolvedFusionBackgrounds.source).toBe('base');
    expect(result.current.backgrounds.map((entry) => entry.background_id)).toEqual([1, 2]);
    expect(result.current.selectableBackgrounds.map((entry) => entry.background_id)).toEqual([
      1,
    ]);
    expect(result.current.effectiveSelectedBackground?.background_id).toBe(1);
  });

  it('uses fusion backgrounds and resolves combo backgrounds from the fused partner card', () => {
    mocks.instances = {
      'foreign_partner-instance-792': instance('partner-instance-792', '3'),
    };

    const fusionBackground = background(2);
    const comboBackground = background(9);
    const availablePokemon = pokemon({
      fusion: [
        {
          fusion_id: 10,
          name: 'Dawn Wings',
          base_pokemon_id1: 25,
          base_pokemon_id2: 792,
          backgrounds: [fusionBackground, comboBackground],
          background_combo_rules: [
            {
              member1_background_id: 2,
              member2_background_id: 3,
              combo_background_id: 9,
              combo_background_image_url: comboBackground.image_url,
              combo_background_name: comboBackground.name,
              combo_background_date: '',
              combo_background_location: '',
            },
          ],
        } as Fusion,
      ],
    });

    const { result } = renderHook(() =>
      useCaughtInstanceBackgrounds({
        pokemon: availablePokemon,
        variantType: 'fusion_10',
        locationCard: '2',
        fusion: {
          is_fused: true,
          fusion_form: 'Dawn Wings',
          fusedWith: 'partner-instance-792',
          storedFusionObject: null,
        },
      }),
    );

    expect(result.current.resolvedFusionBackgrounds.source).toBe('fusion');
    expect(result.current.resolvedFusionBackgrounds.fusionId).toBe(10);
    expect(result.current.backgrounds.map((entry) => entry.background_id)).toEqual([2, 9]);
    expect(result.current.fusedPartnerInstance?.instance_id).toBe('partner-instance-792');
    expect(result.current.effectiveSelectedBackground?.background_id).toBe(9);
  });
});
