// SearchUI.jsx
import React, { useCallback } from 'react';
import { debounce } from 'lodash';
import './SearchUI.css';

function SearchUI({
  searchTerm,
  onSearchChange,
  showEvolutionaryLine,
  toggleEvolutionaryLine,
  totalPokemon,
  showCount, // new prop to conditionally render the count
}) {
  const debouncedSearchChange = useCallback(
    debounce((value) => onSearchChange(value), 250),
    [onSearchChange]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    debouncedSearchChange(value);
  };

  return (
    <div className="header-section search-section">
      {/* Render the Pokémon count only if showCount is true */}
      {showCount && (
        <div className="pokemon-count">
          <span>Pokémon</span>
          <span>({totalPokemon})</span>
        </div>
      )}
      <input
        type="text"
        placeholder="Search..."
        defaultValue={searchTerm}
        onChange={handleInputChange}
      />
      <label className="evo-line-checkbox">
        <div className="checkbox-container">
          <input
            id="evolutionaryLineCheckbox"
            type="checkbox"
            className="evo-checkbox"
            checked={showEvolutionaryLine}
            onChange={toggleEvolutionaryLine}
          />
          <span className="evo-line-custom-checkbox"></span>
        </div>
        SHOW EVOLUTIONARY LINE
      </label>
    </div>
  );
}

export default SearchUI;
