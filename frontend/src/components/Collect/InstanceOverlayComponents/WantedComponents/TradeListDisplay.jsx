// TradeListDisplay.jsx

import React from 'react';

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

    // Check if the current wanted instance is a mirror
    const isMirror = pokemon.ownershipStatus.mirror;

    const tradeListToDisplay = Object.entries(lists.trade)
        .filter(([key, details]) => {
            if (isMirror) {
                // If this is a mirror instance, only show trade instances with matching baseKey
                return extractBaseKey(key) === baseKey;
            }
            // Otherwise, show all instances not marked as 'not_trade'
            return !localNotTradeList[key];
        });

    if (!lists || tradeListToDisplay.length === 0) {
        return <div>No Pokémon currently for trade.</div>;
    }

    return (
        <div className="trade-list-container">
            {tradeListToDisplay.map(([key, details]) => (
                <div key={key} className="trade-item">
                    <img 
                        src={details.currentImage}
                        alt={`Trade Pokémon ${key}`}
                        className={localNotTradeList[key] ? 'grey-out' : ''}
                    />
                    {editMode && (
                        <button 
                            className="toggle-not-trade"
                            onClick={() => handleNotTradeToggle(key)}
                        >
                            {localNotTradeList[key] ? '✓' : 'X'}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TradeListDisplay;
