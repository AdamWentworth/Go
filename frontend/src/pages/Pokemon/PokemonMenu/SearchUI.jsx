// SearchUI.jsx
import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import './SearchUI.css';

function SearchUI({
  searchTerm, // initial value from parent
  onSearchChange,
  showEvolutionaryLine,
  toggleEvolutionaryLine,
}) {
  const [inputValue, setInputValue] = useState(searchTerm);
  const [isFocused, setIsFocused] = useState(false);

  const debouncedSearchChange = useCallback(
    debounce((value) => onSearchChange(value), 250),
    [onSearchChange]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearchChange(value);
  };

  const showEvoCheckbox = inputValue.trim() !== '';

  return (
    <div className={`header-section search-section ${showEvoCheckbox ? 'with-evo-checkbox' : ''}`}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="search-input"
        />
        {/* Render the placeholder only when the input is empty and not focused */}
        {!isFocused && inputValue.trim() === '' && (
          <div className="placeholder-container">
            <img
              src="/images/search_icon.png"
              alt="Search Icon"
              className="search-icon"
            />
            <span className="placeholder-text">Search</span>
          </div>
        )}
      </div>
      {showEvoCheckbox && (
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
      )}
    </div>
  );
}

export default SearchUI;