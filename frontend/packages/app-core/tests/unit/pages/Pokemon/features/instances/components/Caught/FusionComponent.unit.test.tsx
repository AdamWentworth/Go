import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FusionComponent from '@/pages/Pokemon/features/instances/components/Caught/FusionComponent';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Fusion } from '@/types/pokemonSubTypes';

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
  it('shows a visible Fuse action for unfused pokemon even when edit mode is off', () => {
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

    expect(screen.getByRole('button', { name: 'Separate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Separate' })).toBeDisabled();
  });

  it('triggers separate action when Separate is clicked in edit mode', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Separate' }));
    expect(onUndoFusion).toHaveBeenCalledTimes(1);
  });
});
