import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FusionComponent from '@/pages/Pokemon/features/instances/components/Caught/FusionComponent';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Fusion } from '@/types/pokemonSubTypes';

type MockInstancesState = {
  instances: Record<string, unknown>;
  foreignInstances: Record<string, unknown> | null;
};

let mockInstancesState: MockInstancesState = {
  instances: {},
  foreignInstances: null,
};

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (
    selector: (state: MockInstancesState) => unknown,
  ) => selector(mockInstancesState),
}));

function makePokemon(overrides: Record<string, unknown> = {}): PokemonVariant {
  return {
    pokemon_id: 150,
    instanceData: { shiny: false },
    ...overrides,
  } as unknown as PokemonVariant;
}

function makeFusion(overrides: Record<string, unknown> = {}): Fusion {
  return {
    date_available: '2024-01-01',
    base_pokemon_id1: 150,
    base_pokemon_id2: 151,
    type_1_id: 1,
    type1_name: 'Psychic',
    type2_name: 'Ghost',
    name: 'Dusk Form',
    fusion_id: 1,
    ...overrides,
  };
}

describe('FusionComponent', () => {
  it('uses fused partner shiny state for right-side icon', () => {
    mockInstancesState = {
      instances: {
        'reshiram-instance': {
          instance_id: 'reshiram-instance',
          shiny: false,
        },
      },
      foreignInstances: null,
    };

    render(
      <FusionComponent
        fusion={[makeFusion({ fusion_id: 3, name: 'White Kyurem', base_pokemon_id1: 646, base_pokemon_id2: 643 })]}
        editMode={false}
        pokemon={makePokemon({
          pokemon_id: 646,
          name: 'Kyurem',
          instanceData: { shiny: true },
        })}
        onFusionToggle={vi.fn()}
        onUndoFusion={vi.fn()}
        fusionState={{ is_fused: true, fusion_form: 3, fusedWith: 'reshiram-instance' }}
      />,
    );

    const rightIcon = screen.getByAltText('Pokemon 643') as HTMLImageElement;
    expect(rightIcon.getAttribute('src')).toContain('/media/images/default/pokemon_643.png');
    expect(rightIcon.getAttribute('src')).not.toContain('/media/images/shiny/shiny_pokemon_643.png');
  });

  it('shows a visible Fuse action for unfused pokemon even when edit mode is off', () => {
    mockInstancesState = { instances: {}, foreignInstances: null };
    render(
      <FusionComponent
        fusion={[makeFusion()]}
        editMode={false}
        pokemon={makePokemon()}
        onFusionToggle={vi.fn()}
        onUndoFusion={vi.fn()}
        fusionState={{ is_fused: false, fusion_form: null }}
      />,
    );

    expect(screen.getByRole('button', { name: /Fuse/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fuse/i })).toBeDisabled();
  });

  it('triggers fusion selection when Fuse is clicked in edit mode', () => {
    mockInstancesState = { instances: {}, foreignInstances: null };
    const onFusionToggle = vi.fn();

    render(
      <FusionComponent
        fusion={[makeFusion({ fusion_id: 3, name: 'Black Form' })]}
        editMode={true}
        pokemon={makePokemon()}
        onFusionToggle={onFusionToggle}
        onUndoFusion={vi.fn()}
        fusionState={{ is_fused: false, fusion_form: null }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Fuse/i }));
    expect(onFusionToggle).toHaveBeenCalledWith(3);
  });

  it('shows Separate action when pokemon is already fused even without fusion options', () => {
    mockInstancesState = { instances: {}, foreignInstances: null };
    render(
      <FusionComponent
        fusion={null}
        editMode={false}
        pokemon={makePokemon()}
        onFusionToggle={vi.fn()}
        onUndoFusion={vi.fn()}
        fusionState={{ is_fused: true, fusion_form: 'Dusk Form' }}
      />,
    );

    expect(screen.getByRole('button', { name: /Separate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Separate/i })).toBeDisabled();
  });

  it('triggers separate action when Separate is clicked in edit mode', () => {
    mockInstancesState = { instances: {}, foreignInstances: null };
    const onUndoFusion = vi.fn();

    render(
      <FusionComponent
        fusion={[makeFusion()]}
        editMode={true}
        pokemon={makePokemon()}
        onFusionToggle={vi.fn()}
        onUndoFusion={onUndoFusion}
        fusionState={{ is_fused: true, fusion_form: 'Dusk Form' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Separate/i }));
    expect(onUndoFusion).toHaveBeenCalledTimes(1);
  });
});
