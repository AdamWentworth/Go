import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import VariantSearchPreviewPanel from '@/pages/Search/SearchParameters/VariantSearchPreviewPanel';
import type { PokemonVariant } from '@/types/pokemonVariants';

vi.mock('@/pages/Search/SearchParameters/VariantComponents/MovesSearch', () => ({
  default: () => <div data-testid="moves-search" />,
}));

vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: () => <div data-testid="gender-component" />,
}));

const baseProps = () => ({
  selectedBackground: {
    background_id: 1,
    image_url: '/images/bg.png',
    name: 'City',
    location: 'Seattle',
    date: '2025-01-01',
  },
  imageUrl: '/images/pokemon.png',
  imageError: false,
  pokemon: 'Bulbasaur',
  onImageError: vi.fn(),
  dynamax: true,
  gigantamax: false,
  currentPokemonData: { gender_rate: '50_50_0' } as unknown as PokemonVariant,
  selectedMoves: {
    fastMove: null,
    chargedMove1: null,
    chargedMove2: null,
  },
  onMovesChange: vi.fn(),
  onGenderChange: vi.fn(),
  backgroundAllowed: true,
  onOpenBackgroundOverlay: vi.fn(),
  canDynamax: true,
  onToggleMax: vi.fn(),
}) as React.ComponentProps<typeof VariantSearchPreviewPanel>;

describe('VariantSearchPreviewPanel', () => {
  it('renders image/moves/gender and forwards background/max actions', () => {
    const props = baseProps();
    const { container } = render(<VariantSearchPreviewPanel {...props} />);

    expect(screen.getByTestId('moves-search')).toBeInTheDocument();
    expect(screen.getByTestId('gender-component')).toBeInTheDocument();
    expect(screen.getByAltText('Bulbasaur')).toBeInTheDocument();
    expect(screen.getByAltText('Dynamax Badge')).toBeInTheDocument();

    fireEvent.click(screen.getByAltText('Background Selector'));
    fireEvent.click(screen.getByAltText('Dynamax'));
    fireEvent.error(screen.getByAltText('Bulbasaur'));

    expect(props.onOpenBackgroundOverlay).toHaveBeenCalledTimes(1);
    expect(props.onToggleMax).toHaveBeenCalledTimes(1);
    expect(props.onImageError).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.background-image')).toBeInTheDocument();
  });

  it('renders fallback error state when image load failed', () => {
    const props = baseProps();
    props.imageError = true;
    props.imageUrl = '/images/invalid.png';
    props.selectedBackground = null;
    props.backgroundAllowed = false;
    props.canDynamax = false;

    render(<VariantSearchPreviewPanel {...props} />);
    expect(screen.getByText("This variant doesn't exist.")).toBeInTheDocument();
    expect(screen.queryByAltText('Background Selector')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Dynamax (Desaturated)')).not.toBeInTheDocument();
  });
});
