/*searchUI.jsx*/

import React from 'react';
import './SearchUI.css'; // Your CSS file should include the styles for the evolutionary line checkbox

function SearchUI({
    searchTerm,
    onSearchChange,
    showEvolutionaryLine, // state to track if the checkbox is checked
    toggleEvolutionaryLine, // function to handle checkbox changes
}) {
    return (
        <div className="header-section search-section">
            <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm} 
                onChange={(e) => onSearchChange(e.target.value)}
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
