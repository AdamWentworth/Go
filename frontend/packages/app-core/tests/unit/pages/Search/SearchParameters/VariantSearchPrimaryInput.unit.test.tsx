import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { VariantSearchPrimaryInput } from '@/pages/Search/SearchParameters/VariantSearch';
import type { UseVariantSearchControllerResult } from '@/pages/Search/SearchParameters/useVariantSearchController';

const buildController = (
  overrides: Partial<UseVariantSearchControllerResult> = {},
): UseVariantSearchControllerResult =>
  ({
    handleImageError: vi.fn(),
    handleInputBlur: vi.fn(),
    handleInputFocus: vi.fn(),
    handlePokemonChange: vi.fn(),
    handleSuggestionClick: vi.fn(),
    imageError: false,
    imageUrl: '/images/bulbasaur.png',
    selectedBackground: {
      background_id: 1,
      costume_id: undefined,
      date: '2026-08-19',
      image_url: '/images/location-background.png',
      location: 'Vancouver',
      name: 'Vancouver background',
    },
    suggestions: [],
    ...overrides,
  }) as UseVariantSearchControllerResult;

describe('VariantSearchPrimaryInput', () => {
  it('shows the exact selected Pokémon appearance beside the input', () => {
    const controller = buildController();

    render(
      <VariantSearchPrimaryInput
        controller={controller}
        dynamax
        gigantamax={false}
        pokemon="Bulbasaur"
      />,
    );

    expect(screen.getByPlaceholderText('Enter Pokemon name')).toHaveValue(
      'Bulbasaur',
    );
    const preview = screen.getByAltText('Bulbasaur preview');
    expect(preview).toHaveAttribute('src', '/images/bulbasaur.png');
    expect(preview.parentElement).toHaveClass('has-background');
    expect(preview.parentElement).toHaveStyle({
      backgroundImage: 'url(/images/location-background.png)',
    });
    expect(screen.getByAltText('Dynamax')).toHaveAttribute(
      'src',
      '/images/dynamax.png',
    );

    fireEvent.error(preview);
    expect(controller.handleImageError).toHaveBeenCalledTimes(1);
  });

  it('does not reserve preview space before a valid image is available', () => {
    render(
      <VariantSearchPrimaryInput
        controller={buildController({ imageUrl: null })}
        dynamax={false}
        gigantamax={false}
        pokemon="Bul"
      />,
    );

    expect(screen.getByPlaceholderText('Enter Pokemon name')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
