// SearchUI.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import './SearchUI.css';

function SearchUI({
  searchTerm,
  onSearchChange,
  showEvolutionaryLine,
  toggleEvolutionaryLine,
  onFocusChange,
}) {
  const [inputValue, setInputValue] = useState(searchTerm);

  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const debouncedSearchChange = useCallback(
    debounce((value) => {
      onSearchChange(value);
    }, 250),
    [onSearchChange]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearchChange(value);
  };

  const handleFocus = () => {
    if (onFocusChange) {
      onFocusChange(true);
    }
  };

  return (
    <div className="header-section search-section">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={inputValue}
          onFocus={handleFocus}
          onChange={handleInputChange}
          className="search-input"
        />
        {inputValue.trim() === '' && (
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
      {inputValue.trim() !== '' && (
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
