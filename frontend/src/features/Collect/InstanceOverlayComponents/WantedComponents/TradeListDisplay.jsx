// TradeListDisplay.jsx

import React, { useState, useEffect } from 'react';
import './TradeListDisplay.css';
import useSortManager from '../../../../hooks/sort/useSortManager';

const extractBaseKey = (pokemonKey) => {
    let keyParts = String(pokemonKey).split('_');
    keyParts.pop(); // Remove the UUID part if present
    return keyParts.join('_');
};

const TradeListDisplay = ({ pokemon, lists, localNotTradeList, setLocalNotTradeList, editMode, toggleReciprocalUpdates, sortType, sortMode, onPokemonClick }) => {
    
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleNotTradeToggle = (key) => {
        if (editMode) {
            const updatedNotTrade = !(localNotTradeList[key] || false);
            setLocalNotTradeList({ ...localNotTradeList, [key]: updatedNotTrade });
            toggleReciprocalUpdates(key, updatedNotTrade);
        }
    };

    const baseKey = extractBaseKey(pokemon.ownershipStatus.instance_id);

    const tradeListToDisplay = Object.entries(lists.trade)
            .filter(([key, details]) => {
                const itemBaseKey = extractBaseKey(key);
                const mirrorCondition = !details.mirror || (details.mirror && itemBaseKey === baseKey);

                return (!localNotTradeList[key] || editMode) && mirrorCondition;
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

    // Conditionally limit max items per row to 3 on small screens
    const gridClass = isSmallScreen ? 'max-3-per-row' : '';

    return (
        <div className={`trade-list-container ${containerClass} ${gridClass}`}>
            {sortedTradeListToDisplay.map((pokemon) => {
                const isNotTrade = localNotTradeList[pokemon.key];
                const imageClasses = `trade-item-img ${isNotTrade ? 'grey-out' : ''}`;

                return (
                    <div
                        key={pokemon.key}
                        className="trade-item"
                        onClick={() => {
                            if (!editMode) {
                                // Only trigger onPokemonClick when not in edit mode
                                console.log(`Clicked Pokemon Key: ${pokemon.key}`);
                                onPokemonClick(pokemon.key);
                            }
                        }}
                    >
                        {/* Dynamax Icon */}
                        {pokemon.variantType?.includes('dynamax') && (
                            <img
                                src={`${process.env.PUBLIC_URL}/images/dynamax.png`}
                                alt="Dynamax"
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    right: '3%',
                                    width: '30%',
                                    height: 'auto',
                                    zIndex: 0,
                                }}
                            />
                        )}
                        {/* Gigantamax Icon */}
                        {pokemon.variantType?.includes('gigantamax') && (
                            <img
                                src={`${process.env.PUBLIC_URL}/images/gigantamax.png`}
                                alt="Gigantamax"
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    right: '3%',
                                    width: '30%',
                                    height: 'auto',
                                    zIndex: 0,
                                }}
                            />
                        )}
                        <img 
                            src={pokemon.image_url}
                            alt={`Trade Pokémon ${pokemon.name}`}
                            className={imageClasses}
                            title={`${pokemon.form ? `${pokemon.form} ` : ''}${pokemon.name}`}
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