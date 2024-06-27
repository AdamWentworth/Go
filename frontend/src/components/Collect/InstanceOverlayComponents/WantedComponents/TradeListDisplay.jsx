// TradeListDisplay.jsx

import React from 'react';

const TradeListDisplay = ({ pokemon, lists, localNotTradeList, setLocalNotTradeList, editMode, toggleReciprocalUpdates }) => {
    const handleNotTradeToggle = (key) => {
        if (editMode) {
            const updatedNotTrade = !(localNotTradeList[key] || false);
            setLocalNotTradeList({ ...localNotTradeList, [key]: updatedNotTrade });
            // Prepare for reciprocal updates once edit mode is off
            toggleReciprocalUpdates(key, updatedNotTrade);
        }
    };

    if (!lists || Object.keys(lists.trade).length === 0) {
        return <div>No Pokémon currently for trade.</div>;
    }

    return (
        <div className="trade-list-container">
            {Object.entries(lists.trade)
                // Filter out entries that are not for trade or have details.mirror true
                .filter(([key, details]) => {
                    const shouldShow = !localNotTradeList[key] && (!details.mirror || (details.mirror && pokemon.ownershipStatus.mirror));
                    const shouldShowInEditMode = editMode && (!details.mirror || (details.mirror && pokemon.ownershipStatus.mirror));
                    return shouldShow || shouldShowInEditMode;
                })
                .map(([key, details]) => (
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
