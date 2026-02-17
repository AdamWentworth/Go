import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TradeImageStage from '@/pages/Pokemon/features/instances/sections/TradeImageStage';
import TradeBackgroundModal from '@/pages/Pokemon/features/instances/sections/TradeBackgroundModal';
import type { VariantBackground } from '@/types/pokemonSubTypes';

vi.mock('@/components/pokemonComponents/BackgroundLocationCard', () => ({
  __esModule: true,
  default: ({
    onSelectBackground,
  }: {
    onSelectBackground: (background: VariantBackground) => void;
  }) => (
    <button
      onClick={() =>
        onSelectBackground({
          background_id: 7,
          image_url: 'bg-7.png',
          name: 'Mock BG',
          costume_id: 0,
          date: '2026-02-17',
          location: 'test',
        })
      }
    >
      mock-pick-background
    </button>
  ),
}));

describe('Trade sections', () => {
  it('TradeImageStage renders image, background, and max badges', () => {
    render(
      <TradeImageStage
        selectedBackground={{
          background_id: 99,
          image_url: 'bg-99.png',
          name: 'Special',
          costume_id: 0,
          date: '2026-02-17',
          location: 'test',
        }}
        currentImage="pokemon.png"
        name="Pikachu"
        dynamax
        gigantamax
      />,
    );

    expect(screen.getByAltText('Pikachu')).toHaveAttribute('src', 'pokemon.png');
    expect(screen.getByAltText('Dynamax Badge')).toBeInTheDocument();
    expect(screen.getByAltText('Gigantamax Badge')).toBeInTheDocument();
    expect(document.querySelector('.background-image')).toBeTruthy();
  });

  it('TradeBackgroundModal opens/closes and relays background selections', () => {
    const onClose = vi.fn();
    const onSelectBackground = vi.fn();

    render(
      <TradeBackgroundModal
        showBackgrounds
        pokemon={
          {
            backgrounds: [],
            instanceData: {},
            max: [],
          } as never
        }
        onClose={onClose}
        onSelectBackground={onSelectBackground}
      />,
    );

    fireEvent.click(screen.getByText('mock-pick-background'));
    expect(onSelectBackground).toHaveBeenCalledWith({
      background_id: 7,
      image_url: 'bg-7.png',
      name: 'Mock BG',
      costume_id: 0,
      date: '2026-02-17',
      location: 'test',
    });

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
