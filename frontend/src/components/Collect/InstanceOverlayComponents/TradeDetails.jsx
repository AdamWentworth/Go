// TradeDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from './EditSaveComponent';
import { PokemonDataContext } from '../../../contexts/PokemonDataContext';
import { generateUUID } from '../utils/PokemonIDUtils';

const TradeDetails = ({ pokemon, lists, ownershipData }) => {
    const { mirror } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [isMirror, setIsMirror] = useState(mirror);
    const [displayedWantedList, setDisplayedWantedList] = useState(lists.wanted);
    const { updateDetails } = useContext(PokemonDataContext);

    const toggleEditMode = () => {
        if (editMode) {
            console.log("Saving changes...");
            updateDetails(pokemon.pokemonKey, { mirror: isMirror});
        }
        setEditMode(!editMode);
    };

    useEffect(() => {
        if (isMirror) {
            initializeMirror();
        } else {
            setDisplayedWantedList(lists.wanted); // Reset to original wanted list when toggled off
        }
    }, [isMirror]); // React on isMirror change

    const initializeMirror = () => {
        const originalData = ownershipData[pokemon.pokemonKey];
        let basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_'); // Extract identifier base
    
        // Find if an appropriate mirror already exists
        let existingMirrorKey = Object.keys(ownershipData).find(key => {
            const targetData = ownershipData[key];
            const isCorrectMirror = key.startsWith(basePrefix) &&
                                    targetData.is_wanted &&
                                    !targetData.is_owned &&
                                    !targetData.is_for_trade &&
                                    targetData.pokemon_id === originalData.pokemon_id; // Ensure same Pokémon ID
    
            if (isCorrectMirror) {
                console.log("Found existing mirror: ", key);
            }
            
            return isCorrectMirror;
        });
    
        if (existingMirrorKey) {
            // If mirror exists, use it
            setDisplayedWantedList({ [existingMirrorKey]: ownershipData[existingMirrorKey] });
        } else {
            // If no existing mirror, create a new one
            console.log("Creating new mirror entry");
            const newKey = `${basePrefix}_${generateUUID()}`;
            const newData = { 
                ...originalData,
                is_wanted: true,
                is_owned: false,
                is_for_trade: false,
                is_unowned: false,
                mirror: true // Explicitly mark as mirror
            };
            ownershipData[newKey] = newData;
            setDisplayedWantedList({ [newKey]: newData });
            updateDetails(pokemon.pokemonKey, { mirror: isMirror});
        }
    };     

    const toggleMirror = () => {
        if (editMode) {
            const newMirrorState = !isMirror;
            setIsMirror(newMirrorState);  // This will trigger the useEffect below
        }
    };   

    const renderWantedListDetails = () => {
        if (!displayedWantedList || Object.keys(displayedWantedList).length === 0) {
            return <div>No Pokémon currently wanted.</div>;
        }
    
        return (
            <div className="wanted-list-container">
                {Object.entries(displayedWantedList).map(([key, details]) => {
                    // Determine the correct image source: use details.currentImage if available, otherwise fallback to pokemon.currentImage
                    const imageSrc = details.currentImage || pokemon.currentImage;
    
                    return (
                        <div key={key} className="wanted-item">
                            <img src={imageSrc} alt={`Wanted Pokémon ${key}`} onError={(e) => {
                                // Fallback to pokemon.currentImage if details.currentImage fails to load
                                if (e.target.src !== pokemon.currentImage) {
                                    e.target.src = pokemon.currentImage;
                                }
                            }} />
                        </div>
                    );
                })}
            </div>
        );
    };    

    return (
        <div className="trade-details-container">
            <div className="top-row">
                <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                <div className="mirror">
                    <img 
                        src={process.env.PUBLIC_URL + '/images/mirror.png'} 
                        alt="Mirror" 
                        className={isMirror ? '' : 'grey-out'} 
                        onClick={toggleMirror}
                        style={{ cursor: editMode ? 'pointer' : 'default' }}
                    />
                </div>
            </div>         
            <div>
                <h2>Wanted List:</h2>
                {renderWantedListDetails()}
            </div>
        </div>
    );
};

export default TradeDetails;