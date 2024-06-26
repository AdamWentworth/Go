// TradeListDisplay.jsx

import React from 'react';

const TradeListDisplay = ({ lists, localNotTradeList, setLocalNotTradeList, editMode, toggleReciprocalUpdates }) => {
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
            {Object.entries(lists.trade).filter(([key]) => editMode || !(localNotTradeList[key])).map(([key, details]) => (
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
