import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import VariantSearchBackgroundOverlay from '@/pages/Search/SearchParameters/VariantSearchBackgroundOverlay';
import type { PokemonVariant } from '@/types/pokemonVariants';

vi.mock('@/components/pokemonComponents/BackgroundLocationCard', () => ({
  default: ({
    onSelectBackground,
    selectedCostumeId,
  }: {
    onSelectBackground: (value: unknown) => void;
    selectedCostumeId?: number;
  }) => (
    <div>
      <span data-testid="selected-costume-id">{String(selectedCostumeId ?? '')}</span>
      <button
        type="button"
        data-testid="select-background"
        onClick={() =>
          onSelectBackground({
            background_id: 1,
            image_url: '/images/bg.png',
            name: 'City',
            location: 'Seattle',
            date: '2025-01-01',
          })
        }
      >
        select
      </button>
    </div>
  ),
}));

describe('VariantSearchBackgroundOverlay', () => {
  it('does not render while closed', () => {
    render(
      <VariantSearchBackgroundOverlay
        isOpen={false}
        onClose={vi.fn()}
        currentPokemonData={undefined}
        onSelectBackground={vi.fn()}
        selectedCostumeId={undefined}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders while open and forwards close/select actions', () => {
    const onClose = vi.fn();
    const onSelectBackground = vi.fn();
    const { container } = render(
      <VariantSearchBackgroundOverlay
        isOpen={true}
        onClose={onClose}
        currentPokemonData={{ name: 'Bulbasaur' } as unknown as PokemonVariant}
        onSelectBackground={onSelectBackground}
        selectedCostumeId={7}
      />,
    );

    fireEvent.click(container.querySelector('.background-overlay-content') as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('select-background'));
    expect(onSelectBackground).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('selected-costume-id')).toHaveTextContent('7');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(container.querySelector('.background-overlay') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

