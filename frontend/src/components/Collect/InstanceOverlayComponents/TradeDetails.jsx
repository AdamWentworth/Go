// TradeDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from './EditSaveComponent';
import { PokemonDataContext } from '../../../contexts/PokemonDataContext';
import { generateUUID } from '../utils/PokemonIDUtils';

const TradeDetails = ({ pokemon, lists, ownershipData }) => {
    const { mirror, not_wanted_list } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [isMirror, setIsMirror] = useState(mirror);
    const [displayedWantedList, setDisplayedWantedList] = useState(lists.wanted);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...pokemon.ownershipStatus.not_wanted_list });
    const { updateDetails } = useContext(PokemonDataContext);

    const toggleEditMode = () => {
        if (editMode) {
            console.log("Saving changes...");
            updateDetails(pokemon.pokemonKey, { 
                mirror: isMirror,
                not_wanted_list: localNotWantedList
            });
            Object.assign(not_wanted_list, localNotWantedList); // Update the original list with local changes
        } else {
            setLocalNotWantedList({ ...not_wanted_list }); // Reset local list to original when entering edit mode
        }
        setEditMode(!editMode);
    };

    useEffect(() => {
        // Clean up not_wanted_list on component mount
        const cleanNotWantedList = () => {
            Object.keys(localNotWantedList).forEach(key => {
                if (!(key in lists.wanted)) {
                    delete localNotWantedList[key];
                }
            });
        };
        cleanNotWantedList();
        setDisplayedWantedList(lists.wanted);
    }, []); // Run only on mount    

    useEffect(() => {
        if (isMirror) {
            initializeMirror();
        } else {
            setDisplayedWantedList(lists.wanted); // Reset to original wanted list when toggled off
        }
    }, [isMirror]); // React on isMirror change

    useEffect(() => {
        if (!editMode) {
            // Filter out the not_wanted_list Pokémon when edit mode is off
            const filteredList = Object.keys(lists.wanted)
                .filter(key => !(key in not_wanted_list))
                .reduce((res, key) => (res[key] = lists.wanted[key], res), {});
            setDisplayedWantedList(filteredList);
        } else {
            // Show all wanted Pokémon when edit mode is on
            setDisplayedWantedList(lists.wanted);
        }
    }, [editMode, lists.wanted, not_wanted_list]); // React on edit mode and list changes

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
            lists.wanted[newKey] = newData
            setDisplayedWantedList({ [newKey]: newData });
        }
    };     

    const toggleMirror = () => {
        if (editMode) {
            const newMirrorState = !isMirror;
            setIsMirror(newMirrorState);  // This will trigger the useEffect below
        }
    };

    const toggleNotWanted = (key) => {
        const updatedList = { ...localNotWantedList };
        if (key in updatedList) {
            delete updatedList[key];
        } else {
            updatedList[key] = true;
        }
        setLocalNotWantedList(updatedList);
        if (!editMode) {
            // Re-filter the displayed list only when not in edit mode
            const filteredList = Object.keys(lists.wanted)
                .filter(k => !(k in updatedList))
                .reduce((res, k) => (res[k] = lists.wanted[k], res), {});
            setDisplayedWantedList(filteredList);
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
                    const isNotWanted = key in localNotWantedList;
    
                    return (
                        <div key={key} className="wanted-item">
                            {editMode && (
                                <button className="toggle-not-wanted" onClick={() => toggleNotWanted(key)}>
                                    {isNotWanted ? '✓' : 'X'}
                                </button>
                            )}
                            <img 
                                src={imageSrc} 
                                alt={`Wanted Pokémon ${key}`} 
                                className={isNotWanted && editMode ? 'grey-out' : ''} 
                                onError={(e) => {
                                    // Fallback to pokemon.currentImage if details.currentImage fails to load
                                    if (e.target.src !== details.currentImage) {
                                        e.target.src = pokemon.currentImage;
                                    }
                                }} 
                            />
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