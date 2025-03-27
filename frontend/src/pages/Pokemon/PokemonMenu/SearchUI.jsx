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
  const [isFocused, setIsFocused] = useState(false);

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
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const getLayoutClass = () => {
    if (inputValue.trim() !== '') {
      return 'search-layout--with-text';
    } else if (isFocused) {
      return 'search-layout--focused';
    } else {
      return 'search-layout--base';
    }
  };

  const layoutClass = getLayoutClass();

  return (
    <div className={`header-section search-section ${layoutClass}`}>
      <div className="search-row">
        <div className="arrow-input-wrapper">
          <img
            src="/images/arrow_right.png"
            alt="Arrow Left"
            className="arrow-icon"
          />

          <div className="search-input-wrapper">
            <input
              type="text"
              value={inputValue}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={handleInputChange}
              className="search-input"
            />
            {/* Left-aligned search icon for focused/text states */}
            <img
              src="/images/search_icon.png"
              alt="Search Icon"
              className="search-icon-left"
            />
            {/* Centered placeholder only for base state */}
            {layoutClass === 'search-layout--base' && (
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
        </div>
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
            <span className="evo-line-custom-checkbox" />
          </div>
          SHOW EVOLUTIONARY LINE
        </label>
      )}
    </div>
  );
}

export default SearchUI;