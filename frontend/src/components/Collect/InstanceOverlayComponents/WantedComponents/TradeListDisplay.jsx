// TradeListDisplay.jsx

import React from 'react';
import './TradeListDisplay.css';
import useSortManager from '../../hooks/useSortManager';  // Ensure this import is correct

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
            // Prepare for reciprocal updates once edit mode is off
            toggleReciprocalUpdates(key, updatedNotTrade);
        }
    };

    // Extract the baseKey of the current Pokémon
    const baseKey = extractBaseKey(pokemon.pokemonKey);

    // Filter the trade list to display relevant items
    const tradeListToDisplay = Object.entries(lists.trade)
        .filter(([key, details]) => {
            const itemBaseKey = extractBaseKey(key);
            // Show all items if in edit mode or if not toggled off
            return (editMode || !localNotTradeList[key]) && 
                   (!details.mirror || (details.mirror && itemBaseKey === baseKey));
        });

    // Transform the array to match the format expected by useSortManager
    const transformedTradeList = tradeListToDisplay.map(([key, details]) => ({
        key: key, // Use the original key for React rendering
        pokemon_id: details.pokemon_id,
        name: details.name,
        pokedex_number: details.pokedex_number,
        image_url: details.currentImage, // Use the correct image URL
        currentImage: details.currentImage,
        image_url_shiny: details.image_url_shiny || details.currentImage, // Use shiny image if available
        ...details, // Include all other properties by spreading the details object
    }));

    // console.log(transformedTradeList)
    // Apply sorting to the transformed list using the useSortManager hook
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
                const isNotTrade = localNotTradeList[pokemon.key]; // Use the correct key to check if it's not for trade
                const imageClasses = `trade-item-img ${isNotTrade ? 'grey-out' : ''}`;
                return (
                    <div key={pokemon.key} className="trade-item"> {/* Use the unique key here */}
                        <img 
                            src={pokemon.image_url}  // Use the correct image URL for rendering
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
