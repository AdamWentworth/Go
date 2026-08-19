import React from 'react';

import type { UseVariantSearchControllerResult } from './useVariantSearchController';
import VariantSearchInput from './VariantSearchInput';

type VariantSearchPrimaryInputProps = {
  controller: UseVariantSearchControllerResult;
  pokemon: string;
};

export const VariantSearchPrimaryInput: React.FC<
  VariantSearchPrimaryInputProps
> = ({ controller, pokemon }) => (
  <div className="search-primary-pokemon-field">
    <label htmlFor="pokemon-search-primary-input">Pokémon</label>
    <VariantSearchInput
      inputId="pokemon-search-primary-input"
      pokemon={pokemon}
      suggestions={controller.suggestions}
      onPokemonChange={controller.handlePokemonChange}
      onInputFocus={controller.handleInputFocus}
      onInputBlur={controller.handleInputBlur}
      onSuggestionClick={controller.handleSuggestionClick}
    />
  </div>
);
