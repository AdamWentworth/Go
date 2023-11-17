/*searchUI.jsx*/

import React from 'react';
import './searchUI.css'; // Your CSS file should include the styles for the evolutionary line checkbox

function SearchUI({
    searchTerm,
    onSearchChange,
    isShiny,
    toggleShiny,
    showCostume,
    toggleCostume,
    showShadow,
    toggleShadow,
    showEvolutionaryLine, // state to track if the checkbox is checked
    toggleEvolutionaryLine // function to handle checkbox changes
}) {
    return (
        <div className="header-section browse-section">
            <h1>Browse</h1>
            <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm} 
                onChange={(e) => onSearchChange(e.target.value)}
            />
            <button onClick={toggleShiny} className={`shiny-button ${isShiny ? 'active' : ''}`}>
                <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
            </button>
            <button onClick={toggleCostume} className={`costume-button ${showCostume ? 'active' : ''}`}>
                <img src="/images/costume_icon.png" alt="Toggle Costume" />
            </button>
            <button onClick={toggleShadow} className={`shadow-button ${showShadow ? 'active' : ''}`}>
                <img src="/images/shadow_icon.png" alt="Toggle Shadow" />
            </button>
            {/* Evolutionary Line Checkbox */}
            <label className="evo-line-checkbox">
                <input
                    id="evolutionaryLineCheckbox"
                    type="checkbox"
                    className="evo-checkbox"
                    checked={showEvolutionaryLine}
                    onChange={toggleEvolutionaryLine}
                />
                <span className="evo-line-custom-checkbox" />
                SHOW EVOLUTIONARY LINE
            </label>
        </div>
    );
}

export default SearchUI;
