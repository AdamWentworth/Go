// FilterUI.jsx

import React, { useEffect, useState } from 'react';
import './FilterUI.css';

const preloadImage = (url) => {
    const img = new Image();
    img.src = url;
};

function FilterUI({
    isShiny,
    toggleShiny,
    showCostume,
    toggleCostume,
    showShadow,
    toggleShadow,
    toggleShowAll,
    showAll,
    isWide,
}) {
    const [touchTarget, setTouchTarget] = useState(null);

    useEffect(() => {
        preloadImage('/images/shiny_icon.png');
        preloadImage('/images/costume_icon.png');
        preloadImage('/images/shadow_icon.png');
    }, []);

    // Handle touch start
    const handleTouchStart = (e, action) => {
        e.preventDefault();
        setTouchTarget(action);
    };

    // Handle touch end
    const handleTouchEnd = (e) => {
        e.preventDefault();
        if (touchTarget === 'showAll') {
            toggleShowAll();
        } else if (touchTarget === 'shiny') {
            toggleShiny();
        } else if (touchTarget === 'costume') {
            toggleCostume();
        } else if (touchTarget === 'shadow') {
            toggleShadow();
        }
        setTouchTarget(null);
    };

    return (
        <div className={`filter-ui ${!isWide ? 'filter-overlay' : ''}`}>
            <div className="button-container">
                <button
                    onTouchStart={(e) => handleTouchStart(e, 'showAll')}
                    onTouchEnd={handleTouchEnd}
                    onClick={(e) => {
                        if (!('ontouchstart' in window)) {
                            toggleShowAll();
                        }
                    }}
                    className={`show-all-button ${showAll ? 'active' : ''}`}
                >
                    Show All
                </button>
                <button
                    onTouchStart={(e) => handleTouchStart(e, 'shiny')}
                    onTouchEnd={handleTouchEnd}
                    onClick={(e) => {
                        if (!('ontouchstart' in window)) {
                            toggleShiny();
                        }
                    }}
                    className={`shiny-button ${isShiny ? 'active' : ''}`}
                >
                    <img src="/images/shiny_icon.png" alt="Toggle Shiny" onContextMenu={(e) => e.preventDefault()} />
                </button>
                <button
                    onTouchStart={(e) => handleTouchStart(e, 'costume')}
                    onTouchEnd={handleTouchEnd}
                    onClick={(e) => {
                        if (!('ontouchstart' in window)) {
                            toggleCostume();
                        }
                    }}
                    className={`costume-button ${showCostume ? 'active' : ''}`}
                >
                    <img src="/images/costume_icon.png" alt="Toggle Costume" onContextMenu={(e) => e.preventDefault()} />
                </button>
                <button
                    onTouchStart={(e) => handleTouchStart(e, 'shadow')}
                    onTouchEnd={handleTouchEnd}
                    onClick={(e) => {
                        if (!('ontouchstart' in window)) {
                            toggleShadow();
                        }
                    }}
                    className={`shadow-button ${showShadow ? 'active' : ''}`}
                >
                    <img src="/images/shadow_icon.png" alt="Toggle Shadow" onContextMenu={(e) => e.preventDefault()} />
                </button>
            </div>
        </div>
    );
}

export default FilterUI;
