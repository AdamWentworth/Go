/*searchUI.jsx*/

import React, { useCallback } from 'react';
import { debounce } from 'lodash';
import './SearchUI.css'; // Your CSS file should include the styles for the evolutionary line checkbox

function SearchUI({
    searchTerm,
    onSearchChange,
    showEvolutionaryLine,
    toggleEvolutionaryLine,
}) {
    // Use useCallback to memoize the debounced function
    const debouncedSearchChange = useCallback(
        debounce((value) => onSearchChange(value), 250),
        []
    );

    const handleInputChange = (e) => {
        const value = e.target.value;
        debouncedSearchChange(value);
    };

    return (
        <div className="header-section search-section">
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
