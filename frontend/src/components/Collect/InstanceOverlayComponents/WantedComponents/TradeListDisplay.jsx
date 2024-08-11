// TradeListDisplay.jsx

import React from 'react';
import './TradeListDisplay.css';

const extractBaseKey = (pokemonKey) => {
    let keyParts = String(pokemonKey).split('_');
    keyParts.pop(); // Remove the UUID part if present
    return keyParts.join('_');
};

const TradeListDisplay = ({ pokemon, lists, localNotTradeList, setLocalNotTradeList, editMode, toggleReciprocalUpdates }) => {
    const handleNotTradeToggle = (key) => {
        if (editMode) {
            const updatedNotTrade = !(localNotTradeList[key] || false);
            setLocalNotTradeList({ ...localNotTradeList, [key]: updatedNotTrade });
            // Prepare for reciprocal updates once edit mode is off
            toggleReciprocalUpdates(key, updatedNotTrade);
        }
    };

    // Extract the baseKey of the current Pokémon
    const baseKey = extractBaseKey(pokemon.pokemonKey);

    const tradeListToDisplay = Object.entries(lists.trade)
        .filter(([key, details]) => {
            const itemBaseKey = extractBaseKey(key);
            // Show all items if in edit mode or if not toggled off
            return (editMode || !localNotTradeList[key]) && 
                   (!details.mirror || (details.mirror && itemBaseKey === baseKey));
        });

    if (!lists || tradeListToDisplay.length === 0) {
        return <div>No Pokémon currently for trade.</div>;
    }

    let containerClass = '';
    if (tradeListToDisplay.length > 30) {
        containerClass = 'xxlarge-list';
    } else if (tradeListToDisplay.length > 15) {
        containerClass = 'xlarge-list';
    } else if (tradeListToDisplay.length > 9) {
        containerClass = 'large-list';
    }

    return (
        <div className={`trade-list-container ${containerClass}`}>
            {tradeListToDisplay.map(([key, details]) => {
                const isNotTrade = localNotTradeList[key];
                const imageClasses = `trade-item-img ${isNotTrade ? 'grey-out' : ''}`;
                return (
                    <div key={key} className="trade-item">
                        <img 
                            src={details.currentImage}
                            alt={`Trade Pokémon ${key}`}
                            className={imageClasses}
                        />
                        {editMode && (
                            <button 
                                className="toggle-not-trade"
                                onClick={() => handleNotTradeToggle(key)}
                            >
                                {isNotTrade ? '✓' : 'X'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TradeListDisplay;