// TradeListDisplay.jsx

import React from 'react';
import './TradeListDisplay.css';
import useSortManager from '../../hooks/useSortManager';

const extractBaseKey = (pokemonKey) => {
    let keyParts = String(pokemonKey).split('_');
    keyParts.pop(); // Remove the UUID part if present
    return keyParts.join('_');
};

const TradeListDisplay = ({ pokemon, lists, localNotTradeList, setLocalNotTradeList, editMode, toggleReciprocalUpdates, sortType, sortMode }) => {
    const handleNotTradeToggle = (key) => {
        if (editMode) {
            const updatedNotTrade = !(localNotTradeList[key] || false);
            setLocalNotTradeList({ ...localNotTradeList, [key]: updatedNotTrade });
            toggleReciprocalUpdates(key, updatedNotTrade);
        }
    };

    const baseKey = extractBaseKey(pokemon.pokemonKey);

    const tradeListToDisplay = Object.entries(lists.trade)
        .filter(([key, details]) => {
            const itemBaseKey = extractBaseKey(key);
            return (editMode || !localNotTradeList[key]) && 
                   (!details.mirror || (details.mirror && itemBaseKey === baseKey));
        });

    const transformedTradeList = tradeListToDisplay.map(([key, details]) => ({
        key,
        pokemon_id: details.pokemon_id,
        name: details.name,
        pokedex_number: details.pokedex_number,
        image_url: details.currentImage,
        currentImage: details.currentImage,
        image_url_shiny: details.image_url_shiny || details.currentImage,
        ...details,
    }));

    const sortedTradeListToDisplay = useSortManager(transformedTradeList, sortType, sortMode, { 
        isShiny: false, 
        showShadow: false, 
        showCostume: false, 
        showAll: true 
    });

    if (!lists || sortedTradeListToDisplay.length === 0) {
        return <div>No Pokémon currently for trade.</div>;
    }

    let containerClass = '';
    if (sortedTradeListToDisplay.length > 30) {
        containerClass = 'xxlarge-list';
    } else if (sortedTradeListToDisplay.length > 15) {
        containerClass = 'xlarge-list';
    } else if (sortedTradeListToDisplay.length > 9) {
        containerClass = 'large-list';
    }

    return (
        <div className={`trade-list-container ${containerClass}`}>
            {sortedTradeListToDisplay.map((pokemon) => {
                const isNotTrade = localNotTradeList[pokemon.key];
                const imageClasses = `trade-item-img ${isNotTrade ? 'grey-out' : ''}`;
                return (
                    <div key={pokemon.key} className="trade-item">
                        <img 
                            src={pokemon.image_url}
                            alt={`Trade Pokémon ${pokemon.name}`}
                            className={imageClasses}
                        />
                        {editMode && (
                            <button 
                                className="toggle-not-trade"
                                onClick={() => handleNotTradeToggle(pokemon.key)}
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
