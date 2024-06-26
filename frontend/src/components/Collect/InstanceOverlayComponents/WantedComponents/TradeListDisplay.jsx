// TradeListDisplay.jsx

import React from 'react';
import { updateNotWantedList } from '../ReciprocalUpdate.jsx';

const TradeListDisplay = ({ pokemon, lists, localNotTradeList, setLocalNotTradeList, editMode, ownershipData }) => {
    const toggleNotTrade = (otherPokemonKey) => {
        if (editMode) {
            const updatedNotTrade = !(localNotTradeList[otherPokemonKey] || false);
            setLocalNotTradeList({ ...localNotTradeList, [otherPokemonKey]: updatedNotTrade });

            // Call to update reciprocal list, using both the current and other Pokemon keys
            updateNotWantedList(ownershipData, pokemon.pokemonKey, otherPokemonKey, updatedNotTrade);
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
                            onClick={() => toggleNotTrade(key)}
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
