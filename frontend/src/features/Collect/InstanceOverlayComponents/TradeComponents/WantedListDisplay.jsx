// WantedListDisplay.jsx

import React, { useState, useEffect } from 'react';
import './WantedListDisplay.css';
import useSortManager from '../../../../hooks/sort/useSortManager';  // Ensure this import is correct

const extractBaseKey = (pokemonKey) => {
    let keyParts = String(pokemonKey).split('_');
    keyParts.pop(); // Remove the UUID part if present
    return keyParts.join('_');
};

const WantedListDisplay = ({ pokemon, lists, localNotWantedList, setLocalNotWantedList, isMirror, mirrorKey, editMode, ownershipData, toggleReciprocalUpdates, sortType, sortMode, onPokemonClick }) => {
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

    const handleNotWantedToggle = (key) => {
        if (editMode) {
            const updatedNotWanted = !(localNotWantedList[key] || false);

            if (updatedNotWanted) {
                // If the value is becoming true, update it as normal
                setLocalNotWantedList({ ...localNotWantedList, [key]: updatedNotWanted });
            } else {
                // If the value is becoming false, drop the key
                const { [key]: _, ...newNotWantedList } = localNotWantedList;
                setLocalNotWantedList(newNotWantedList);
            }

            toggleReciprocalUpdates(key, updatedNotWanted);
        }
    };

    // Extract the baseKey of the current Pokémon
    const baseKey = extractBaseKey(pokemon.pokemonKey);

    // Filter the wanted list to display relevant items
    const wantedListToDisplay = Object.entries(lists.wanted)
        .filter(([key, details]) => {
            const itemBaseKey = extractBaseKey(key);
            // Show all items if in edit mode or if not toggled off
            return (editMode || !localNotWantedList[key]) && 
                   (!isMirror || (isMirror && itemBaseKey === baseKey));
        });

    // Transform the array to match the format expected by useSortManager
    const transformedWantedList = wantedListToDisplay.map(([key, details]) => ({
        key: key, // Use the original key for React rendering
        pokemon_id: details.pokemon_id,
        name: details.name,
        pokedex_number: details.pokedex_number,
        image_url: details.currentImage || pokemon.currentImage, // Use the correct image URL
        image_url_shiny: details.image_url_shiny || details.currentImage, // Use shiny image if available
        ...details, // Include all other properties by spreading the details object
    }));

    // Conditionally apply sorting if not in mirror mode
    const sortedWantedListToDisplay = useSortManager(
        transformedWantedList,
        sortType,
        sortMode,
        { 
            isShiny: false, 
            showShadow: false, 
            showCostume: false, 
            showAll: true 
        }
    );
    
    // Then, conditionally handle the result
    const finalWantedListToDisplay = isMirror 
        ? transformedWantedList 
        : sortedWantedListToDisplay;
    

    if (!lists || finalWantedListToDisplay.length === 0) {
        return <div>No Pokémon currently wanted.</div>;
    }

    // Set the container class based on list size or mirror status
    let containerClass = '';
    if (isMirror) {
        containerClass = 'single-item-list';
    } else if (finalWantedListToDisplay.length > 30) {
        containerClass = 'xxlarge-list';
    } else if (finalWantedListToDisplay.length > 15) {
        containerClass = 'xlarge-list';
    } else if (finalWantedListToDisplay.length > 9) {
        containerClass = 'large-list';
    }

    // Conditionally limit max items per row to 3 on small screens
    const gridClass = isSmallScreen ? 'max-3-per-row' : '';

    return (
        <div className={`wanted-list-container ${containerClass} ${gridClass}`}>
            {finalWantedListToDisplay.map((pokemon) => {
                const isNotWanted = localNotWantedList[pokemon.key];
                const imageClasses = `wanted-item-img ${isNotWanted ? 'grey-out' : ''}`;
                const backdropClasses = `lucky-backdrop ${isNotWanted ? 'grey-out' : ''}`;

                return (
                    <div
                        key={pokemon.key}
                        className="wanted-item"
                        style={{ position: 'relative', overflow: 'hidden' }}
                        onClick={() => {
                            if (!editMode) {
                                // Only trigger onPokemonClick when not in edit mode
                                console.log(`Clicked Pokemon Key: ${pokemon.key}`);
                                onPokemonClick(pokemon.key);
                            }
                        }}
                    >
                        {pokemon.pref_lucky && (
                            <img
                                src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                                className={backdropClasses}
                                alt="Lucky backdrop"
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '75%',
                                    height: 'auto',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 1,
                                }}
                            />
                        )}
                        <img
                            src={pokemon.currentImage}
                            className={imageClasses}
                            alt={`Wanted Pokémon ${pokemon.name}`}
                            style={{ zIndex: 2 }}
                            title={`${pokemon.form ? `${pokemon.form} ` : ''}${pokemon.name}`}
                        />
                        {editMode && (
                            <button
                                className="toggle-not-wanted"
                                onClick={() => handleNotWantedToggle(pokemon.key)}
                                style={{ zIndex: 3 }}
                            >
                                {isNotWanted ? '✓' : 'X'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default WantedListDisplay;