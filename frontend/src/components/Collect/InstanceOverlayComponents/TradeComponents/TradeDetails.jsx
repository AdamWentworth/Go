// TradeDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import WantedListDisplay from './WantedListDisplay';
import MirrorManager from './MirrorManager';
import { updateNotTradeList } from '../ReciprocalUpdate.jsx'; 
import ImageGroup from './ImageGroup';
import { updateDisplayedList } from './utils/listUtils.js'; // Importing updateDisplayedList
import useImageSelection from './utils/useImageSelection.js';
import { EXCLUDE_IMAGES, INCLUDE_ONLY_IMAGES, FILTER_NAMES } from './utils/constants';
import usePokemonFiltering from './hooks/usePokemonFiltering';

const TradeDetails = ({ pokemon, lists, ownershipData, sortType, sortMode }) => {
    const { not_wanted_list, wanted_filters } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const [localWantedFilters, setLocalWantedFilters] = useState({ ...wanted_filters });
    const { updateDetails } = useContext(PokemonDataContext);
    const [isMirror, setIsMirror] = useState(pokemon.ownershipStatus.mirror);
    const [mirrorKey, setMirrorKey] = useState(null);
    const [listsState, setListsState] = useState(lists);
    const [pendingUpdates, setPendingUpdates] = useState({});

    const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection, setSelectedImages: setSelectedExcludeImages } = useImageSelection(EXCLUDE_IMAGES);
    const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection, setSelectedImages: setSelectedIncludeOnlyImages } = useImageSelection(INCLUDE_ONLY_IMAGES);

    // Function to initialize selection states
    const initializeSelection = (filterNames, filters) => {
        return filterNames.map(name => !!filters[name]);
    };

    useEffect(() => {
        if (wanted_filters) {
            setSelectedExcludeImages(initializeSelection(FILTER_NAMES.slice(0, EXCLUDE_IMAGES.length), wanted_filters));
            setSelectedIncludeOnlyImages(initializeSelection(FILTER_NAMES.slice(EXCLUDE_IMAGES.length), wanted_filters));
        }

        setIsMirror(pokemon.ownershipStatus.mirror);
    }, [pokemon.ownershipStatus.mirror, wanted_filters]);

    // Use the custom hook to manage the filtering
    const { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters } = usePokemonFiltering(
        listsState,
        selectedExcludeImages,
        selectedIncludeOnlyImages,
        localWantedFilters,
        setLocalNotWantedList,  // Pass this function to handle reappearing Pokémon
        localNotWantedList      // Pass the current localNotWantedList
    );

    // Sync local filters with the updated filters from the hook
    useEffect(() => {
        setLocalWantedFilters(updatedLocalWantedFilters);
    }, [updatedLocalWantedFilters]);   

    // Ensure localNotWantedList is in sync with pokemon.ownershipStatus.not_wanted_list when remounting
    useEffect(() => {
        setLocalNotWantedList({ ...not_wanted_list });
    }, []);
    
    const toggleEditMode = () => {
        console.log('Toggle Edit Mode Triggered');
        console.log('Edit Mode:', editMode);
    
        // Log the original not_wanted_list
        console.log('Original not_wanted_list:', not_wanted_list);
    
        // Log the localNotWantedList before any updates
        console.log('Local not_wanted_list before update:', localNotWantedList);
    
        if (editMode) {
            // Copy the current localNotWantedList
            const updatedNotWantedList = { ...localNotWantedList };
    
            // Add filtered Pokémon to the updated not_wanted_list
            filteredOutPokemon.forEach(key => {
                updatedNotWantedList[key] = true;
            });
    
            // Log the localNotWantedList after adding filtered out Pokémon
            console.log('Local not_wanted_list after adding filtered Pokémon:', updatedNotWantedList);
    
            // Determine which keys have been added or removed
            const removedKeys = Object.keys(not_wanted_list).filter(key => !updatedNotWantedList[key]);
            const addedKeys = Object.keys(updatedNotWantedList).filter(key => !not_wanted_list[key]);
    
            // Object to accumulate updates for updateDetails
            const updatesToApply = {};
    
            // Handle removed keys
            removedKeys.forEach(key => {
                const updatedNotTradeList = updateNotTradeList(
                    ownershipData,
                    pokemon.pokemonKey,
                    key,
                    false, // Remove from not_trade_list
                    isMirror
                );
    
                if (updatedNotTradeList) {
                    updatesToApply[key] = {
                        not_trade_list: updatedNotTradeList,
                    };
                }
            });
    
            // Handle added keys
            addedKeys.forEach(key => {
                const updatedNotTradeList = updateNotTradeList(
                    ownershipData,
                    pokemon.pokemonKey,
                    key,
                    true, // Add to not_trade_list
                    isMirror
                );
    
                if (updatedNotTradeList) {
                    updatesToApply[key] = {
                        not_trade_list: updatedNotTradeList,
                    };
                }
            });
    
            // Include updates for the main pokemonKey
            updatesToApply[pokemon.pokemonKey] = {
                not_wanted_list: updatedNotWantedList,
                wanted_filters: localWantedFilters,
                mirror: isMirror,
            };
    
            // Handle mirror key management
            if (!isMirror && mirrorKey) {
                console.log('Handling Mirror Key Management');
                delete ownershipData[mirrorKey];
                delete lists.wanted[mirrorKey];
                updateDisplayedList(null, listsState, setListsState);
                setMirrorKey(null);
            }
    
            // After all updates have been accumulated, updateDetails with all keys and their specific updates
            updateDetails([...removedKeys, ...addedKeys, pokemon.pokemonKey], updatesToApply);
    
            // Update localNotWantedList to match updatedNotWantedList
            setLocalNotWantedList(updatedNotWantedList);
    
        } else {
            if (!isMirror && pokemon.ownershipStatus.mirror) {
                updateDetails(pokemon.pokemonKey, {
                    ...pokemon.ownershipStatus,
                    mirror: false,
                });
            }
        }
    
        // Log the localNotWantedList after the toggleEditMode operation
        console.log('Local not_wanted_list after toggleEditMode:', localNotWantedList);
    
        setEditMode(!editMode);

        // Update the not_wanted_list to match localNotWantedList
        pokemon.ownershipStatus.not_wanted_list = localNotWantedList;
    };
    

    const toggleReciprocalUpdates = (key, updatedNotTrade) => {
        setPendingUpdates(prev => ({ ...prev, [key]: updatedNotTrade }));
    };

    return (
        <div className="trade-details-container">
            <div className="top-row">
                <div className="edit-save-container">
                    <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                </div>
                {!isMirror && (
                    <>
                        <div className="header-group">
                            <h3>Exclude</h3>
                        </div>
                        <div className="header-group">
                            <h3>Include Only</h3>
                        </div>
                    </>
                )}
                <div className="mirror">
                    <MirrorManager
                        pokemon={pokemon}
                        ownershipData={ownershipData}
                        lists={lists}
                        isMirror={isMirror}
                        setIsMirror={setIsMirror}
                        setMirrorKey={setMirrorKey}
                        editMode={editMode}
                        updateDisplayedList={(newData) => updateDisplayedList(newData, listsState, setListsState)}
                        updateDetails={updateDetails}
                    />
                </div>
            </div>

            {!isMirror && (
                <div className="image-row-container">
                    <div className="exclude-header-group image-group">
                        <ImageGroup
                            images={EXCLUDE_IMAGES}
                            selectedImages={selectedExcludeImages}
                            toggleImageSelection={toggleExcludeImageSelection}
                            editMode={editMode}
                        />
                    </div>
                    <div className="include-only-header-group image-group">
                        <ImageGroup
                            images={INCLUDE_ONLY_IMAGES}
                            selectedImages={selectedIncludeOnlyImages}
                            toggleImageSelection={toggleIncludeOnlyImageSelection}
                            editMode={editMode}
                        />
                    </div>
                </div>
            )}

            <div>
                <h2>Wanted List:</h2>
                <WantedListDisplay
                    pokemon={pokemon}
                    lists={{ wanted: filteredWantedList }}
                    localNotWantedList={localNotWantedList}
                    isMirror={isMirror}
                    mirrorKey={mirrorKey}
                    setLocalNotWantedList={setLocalNotWantedList}
                    editMode={editMode}
                    ownershipData={ownershipData}
                    toggleReciprocalUpdates={toggleReciprocalUpdates}
                    sortType={sortType}
                    sortMode={sortMode}
                />
            </div>
        </div>
    );
};

export default TradeDetails;
