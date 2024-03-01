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
    toggleEvolutionaryLine, // function to handle checkbox changes
    sortMode, // Add this
    toggleSortMode // And this
}) {
    return (
        <div className="header-section browse-section">
            <h1>Browse</h1>
            <div className="button-container"> {/* New container for buttons */}
                <button onClick={toggleSortMode} className={`sort-button ${sortMode !== 0 ? 'active' : ''}`}>
                    Sort: {sortMode === 0 ? 'Off' : sortMode === 1 ? 'Newest First' : 'Oldest First'}
                </button>
                <button onClick={toggleShiny} className={`shiny-button ${isShiny ? 'active' : ''}`}>
                    <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
                </button>
                <button onClick={toggleCostume} className={`costume-button ${showCostume ? 'active' : ''}`}>
                    <img src="/images/costume_icon.png" alt="Toggle Costume" />
                </button>
                <button onClick={toggleShadow} className={`shadow-button ${showShadow ? 'active' : ''}`}>
                    <img src="/images/shadow_icon.png" alt="Toggle Shadow" />
                </button>
            </div>
            <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm} 
                onChange={(e) => onSearchChange(e.target.value)}
            />
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
