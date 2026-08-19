import React from 'react';

interface VariantSearchInputProps {
  inputId?: string;
  pokemon: string;
  suggestions: string[];
  onPokemonChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  onSuggestionClick: (suggestion: string) => void;
}

const VariantSearchInput: React.FC<VariantSearchInputProps> = ({
  inputId,
  pokemon,
  suggestions,
  onPokemonChange,
  onInputFocus,
  onInputBlur,
  onSuggestionClick,
}) => (
  <div className="pokemon-search-row">
    <input
      id={inputId}
      type="text"
      value={pokemon}
      onChange={onPokemonChange}
      onFocus={onInputFocus}
      onBlur={onInputBlur}
      placeholder="Enter Pokemon name"
    />
    {suggestions.length > 0 && (
      <ul
        className="autocomplete-suggestions"
        onMouseDown={(event) => event.preventDefault()}
      >
        {suggestions.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              className="autocomplete-suggestion-button"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default VariantSearchInput;
