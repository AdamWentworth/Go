import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import VariantSearchInput from '@/pages/Search/SearchParameters/VariantSearchInput';

describe('VariantSearchInput', () => {
  it('forwards input/focus/blur callbacks', () => {
    const onPokemonChange = vi.fn();
    const onInputFocus = vi.fn();
    const onInputBlur = vi.fn();

    render(
      <VariantSearchInput
        pokemon="Bul"
        suggestions={[]}
        onPokemonChange={onPokemonChange}
        onInputFocus={onInputFocus}
        onInputBlur={onInputBlur}
        onSuggestionClick={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('Enter Pokemon name');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Bulb' } });
    fireEvent.blur(input);

    expect(onInputFocus).toHaveBeenCalledTimes(1);
    expect(onPokemonChange).toHaveBeenCalledTimes(1);
    expect(onInputBlur).toHaveBeenCalledTimes(1);
  });

  it('renders suggestions and forwards selection callback', () => {
    const onSuggestionClick = vi.fn();
    render(
      <VariantSearchInput
        pokemon="Bul"
        suggestions={['Bulbasaur', 'Bulbizarre']}
        onPokemonChange={vi.fn()}
        onInputFocus={vi.fn()}
        onInputBlur={vi.fn()}
        onSuggestionClick={onSuggestionClick}
      />,
    );

    fireEvent.click(screen.getByText('Bulbasaur'));
    expect(onSuggestionClick).toHaveBeenCalledWith('Bulbasaur');
    expect(screen.getByText('Bulbizarre')).toBeInTheDocument();
  });
});

