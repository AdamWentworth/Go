import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AppearanceFilters from '@/pages/Search/SearchParameters/AppearanceFilters';
import type { UseVariantSearchControllerResult } from '@/pages/Search/SearchParameters/useVariantSearchController';
import type { PokemonVariant } from '@/types/pokemonVariants';

const variant = {
  name: 'Bulbasaur',
  gender_rate: '50_50_0',
  moves: [
    { move_id: 1, name: 'Vine Whip', is_fast: 1, legacy: false },
    { move_id: 2, name: 'Power Whip', is_fast: 0, legacy: false },
    { move_id: 3, name: 'Sludge Bomb', is_fast: 0, legacy: true },
  ],
} as unknown as PokemonVariant;

const makeController = (
  overrides: Partial<UseVariantSearchControllerResult> = {},
): UseVariantSearchControllerResult =>
  ({
    currentPokemonData: variant,
    availableForms: ['Normal', 'Mega'],
    availableCostumes: [
      { name: 'Party', costume_id: 7, date_available: '2024-01-01' },
    ],
    imageUrl: '/images/bulbasaur.png',
    imageError: false,
    showCostumeDropdown: true,
    selectedBackground: null,
    showBackgroundOverlay: false,
    suggestions: [],
    backgroundAllowed: true,
    selectedCostumeId: 7,
    canDynamax: true,
    hasDynamax: true,
    hasGigantamax: true,
    setMaxMode: vi.fn(),
    toggleMax: vi.fn(),
    setShowBackgroundOverlay: vi.fn(),
    handleImageError: vi.fn(),
    handleBackgroundChange: vi.fn(),
    handleGenderChange: vi.fn(),
    handlePokemonChange: vi.fn(),
    handleInputFocus: vi.fn(),
    handleInputBlur: vi.fn(),
    handleShinyChange: vi.fn(),
    handleShadowChange: vi.fn(),
    handleCostumeToggle: vi.fn(),
    handleCostumeChange: vi.fn(),
    handleFormChange: vi.fn(),
    handleMovesChange: vi.fn(),
    handleSuggestionClick: vi.fn(),
    resetVariantFilters: vi.fn(),
    ...overrides,
  }) as UseVariantSearchControllerResult;

const renderFilters = (
  controller: UseVariantSearchControllerResult = makeController(),
) =>
  render(
    <AppearanceFilters
      controller={controller}
      costume="Party"
      dynamax={false}
      gigantamax={false}
      isShadow={false}
      isShiny={false}
      pokemon="Bulbasaur"
      selectedForm=""
      selectedGender="Any"
      selectedMoves={{
        fastMove: null,
        chargedMove1: null,
        chargedMove2: null,
      }}
    />,
  );

describe('AppearanceFilters', () => {
  it('presents all appearance filter groups with a selected Pokémon preview', () => {
    renderFilters();

    expect(screen.getByText('Variant')).toBeInTheDocument();
    expect(screen.getByText('Gender and moves')).toBeInTheDocument();
    expect(screen.getByText('Location background')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bulbasaur' })).toBeInTheDocument();
    expect(screen.getByLabelText('Fast move')).toBeInTheDocument();
    expect(screen.getByLabelText('Charged move')).toBeInTheDocument();
    expect(screen.getByLabelText('Second charged move')).toBeInTheDocument();
  });

  it('dispatches variant, Max, gender, and background selections', () => {
    const controller = makeController();
    renderFilters(controller);

    fireEvent.click(screen.getByRole('button', { name: /Shiny/ }));
    fireEvent.click(screen.getByRole('button', { name: /Shadow/ }));
    fireEvent.click(screen.getByRole('button', { name: /Costume/ }));
    fireEvent.change(screen.getByLabelText('Form'), {
      target: { value: 'Mega' },
    });
    fireEvent.change(screen.getByLabelText('Costume'), {
      target: { value: 'Party' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Gigantamax' }));
    fireEvent.click(screen.getByRole('button', { name: 'Female' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choose' }));

    expect(controller.handleShinyChange).toHaveBeenCalledTimes(1);
    expect(controller.handleShadowChange).toHaveBeenCalledTimes(1);
    expect(controller.handleCostumeToggle).toHaveBeenCalledTimes(1);
    expect(controller.handleFormChange).toHaveBeenCalledTimes(1);
    expect(controller.handleCostumeChange).toHaveBeenCalledTimes(1);
    expect(controller.setMaxMode).toHaveBeenCalledWith('gigantamax');
    expect(controller.handleGenderChange).toHaveBeenCalledWith('Female');
    expect(controller.setShowBackgroundOverlay).toHaveBeenCalledWith(true);
  });

  it('updates each move slot without changing the other selections', () => {
    const controller = makeController();
    renderFilters(controller);

    fireEvent.change(screen.getByLabelText('Fast move'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Charged move'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Second charged move'), {
      target: { value: '3' },
    });

    expect(controller.handleMovesChange).toHaveBeenNthCalledWith(1, {
      fastMove: 1,
      chargedMove1: null,
      chargedMove2: null,
    });
    expect(controller.handleMovesChange).toHaveBeenNthCalledWith(2, {
      fastMove: null,
      chargedMove1: 2,
      chargedMove2: null,
    });
    expect(controller.handleMovesChange).toHaveBeenNthCalledWith(3, {
      fastMove: null,
      chargedMove1: null,
      chargedMove2: 3,
    });
  });
});
