// FilterUI.jsx

import React, { useEffect } from 'react';
import './FilterUI.css';

// Utility function to preload images
const preloadImage = (url) => {
    const img = new Image();
    img.src = url;
};

function FilterUI({
    isShiny, toggleShiny, showCostume, toggleCostume, showShadow, toggleShadow,
    toggleShowAll
}) {
    useEffect(() => {
        // Preload icons
        preloadImage("/images/shiny_icon.png");
        preloadImage("/images/costume_icon.png");
        preloadImage("/images/shadow_icon.png");
    }, []);

    return (
        <div className="header-section filter-section">
            <div className="button-container">
                <button onClick={toggleShowAll} className="show-all-button">Show All</button>
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
        </div>
    );
}

export default FilterUI;

