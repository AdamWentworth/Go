import React from 'react';

import type { UseVariantSearchControllerResult } from './useVariantSearchController';
import VariantSearchInput from './VariantSearchInput';
import SelectedPokemonPreview from './SelectedPokemonPreview';

type VariantSearchPrimaryInputProps = {
  controller: UseVariantSearchControllerResult;
  dynamax: boolean;
  gigantamax: boolean;
  pokemon: string;
};

export const VariantSearchPrimaryInput: React.FC<
  VariantSearchPrimaryInputProps
> = ({ controller, dynamax, gigantamax, pokemon }) => {
  const hasPreview = Boolean(controller.imageUrl && !controller.imageError);

  return (
    <div className="search-primary-pokemon-field">
      <label htmlFor="pokemon-search-primary-input">Pokémon</label>
      <div
        className={`search-primary-pokemon-control${hasPreview ? ' has-preview' : ''}`}
      >
        <SelectedPokemonPreview
          controller={controller}
          dynamax={dynamax}
          gigantamax={gigantamax}
          pokemon={pokemon}
        />
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
    </div>
  );
};
