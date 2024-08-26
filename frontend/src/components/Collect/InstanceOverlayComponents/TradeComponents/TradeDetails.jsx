// TradeDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import WantedListDisplay from './WantedListDisplay';
import MirrorManager from './MirrorManager';
import { updateNotTradeList } from '../ReciprocalUpdate.jsx'; 
import ImageGroup from './ImageGroup';
import { updateDisplayedList } from './utils/listUtils.js';
import filters from './utils/filters';
import useImageSelection from './utils/useImageSelection.js';
import { EXCLUDE_IMAGES, INCLUDE_ONLY_IMAGES, FILTER_NAMES } from './utils/constants';  // Importing constants

const TradeDetails = ({ pokemon, lists, ownershipData, sortType, sortMode }) => {
    const { not_wanted_list, wanted_filters } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const [localWantedFilters, setLocalWantedFilters] = useState({ ...wanted_filters });
    const { updateDetails } = useContext(PokemonDataContext);
    const [isMirror, setIsMirror] = useState(pokemon.ownershipStatus.mirror);
    const [mirrorKey, setMirrorKey] = useState(null);
    const [listsState, setListsState] = useState(lists);
    const [filteredWantedList, setFilteredWantedList] = useState(lists.wanted); 
    const [pendingUpdates, setPendingUpdates] = useState({});
    const [filteredOutPokemon, setFilteredOutPokemon] = useState([]); // Track filtered Pokémon

    const initializeSelection = (filterNames, filters) => {
        return filterNames.map(name => !!filters[name]);
    };

    const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection, setSelectedImages: setSelectedExcludeImages } = useImageSelection(EXCLUDE_IMAGES);
    const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection, setSelectedImages: setSelectedIncludeOnlyImages } = useImageSelection(INCLUDE_ONLY_IMAGES);

    useEffect(() => {
        if (wanted_filters) {
            setSelectedExcludeImages(initializeSelection(FILTER_NAMES.slice(0, EXCLUDE_IMAGES.length), wanted_filters));
            setSelectedIncludeOnlyImages(initializeSelection(FILTER_NAMES.slice(EXCLUDE_IMAGES.length), wanted_filters));
        }

        setIsMirror(pokemon.ownershipStatus.mirror);
    }, [pokemon.ownershipStatus.mirror, wanted_filters]);

    useEffect(() => {
        let updatedList = { ...listsState.wanted };
        const newlyFilteredOutPokemon = [];

        // Apply exclude filters first
        selectedExcludeImages.forEach((isSelected, index) => {
            const filterName = FILTER_NAMES[index];
            if (isSelected && filters[filterName]) {
                updatedList = filters[filterName](updatedList);
                localWantedFilters[filterName] = true;
            } else {
                delete localWantedFilters[filterName];
            }
        });

        // Track Pokémon filtered out by exclude filters
        Object.keys(listsState.wanted).forEach(key => {
            if (!updatedList[key]) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // Apply include-only filters
        selectedIncludeOnlyImages.forEach((isSelected, index) => {
            const filterIndex = EXCLUDE_IMAGES.length + index;
            const filterName = FILTER_NAMES[filterIndex];
            if (isSelected && filters[filterName]) {
                updatedList = filters[filterName](updatedList);
                localWantedFilters[filterName] = true;
            } else {
                delete localWantedFilters[filterName];
            }
        });

        // Track Pokémon filtered out by include-only filters
        Object.keys(listsState.wanted).forEach(key => {
            if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // Update the state with the final filtered list and the filtered-out Pokémon
        setFilteredWantedList(updatedList);
        setFilteredOutPokemon(newlyFilteredOutPokemon);
        setLocalWantedFilters({ ...localWantedFilters });
    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.wanted]);

    const toggleEditMode = () => {
        // console.log('Toggle Edit Mode Triggered');
        // console.log('Edit Mode:', editMode);

        if (editMode) {
            // Add filtered Pokémon to the not_wanted_list
            const updatedNotWantedList = { ...localNotWantedList };
            filteredOutPokemon.forEach(key => {
                updatedNotWantedList[key] = true;
            });

            // Create a list of all Pokémon keys that need to be updated, ensuring pokemon.pokemonKey is included
            const allKeysToUpdate = [
                ...new Set([
                    pokemon.pokemonKey,
                    ...Object.keys(updatedNotWantedList),
                    ...filteredOutPokemon
                ]),
            ];

            // console.log('All Keys to Update:', allKeysToUpdate);

            // Object to accumulate updates for updateDetails
            const updatesToApply = {};

            // Include updates for the main pokemonKey
            updatesToApply[pokemon.pokemonKey] = {
                not_wanted_list: updatedNotWantedList,
                wanted_filters: localWantedFilters,
                mirror: isMirror,
            };

            // console.log(`Initial Updates to Apply for ${pokemon.pokemonKey}:`, updatesToApply[pokemon.pokemonKey]);

            // Apply reciprocal updates for each Pokémon in allKeysToUpdate
            allKeysToUpdate.forEach(key => {
                if (updatedNotWantedList[key] !== not_wanted_list[key]) {
                    const updatedNotTradeList = updateNotTradeList(ownershipData, pokemon.pokemonKey, key, updatedNotWantedList[key], isMirror);

                    if (updatedNotTradeList) {
                        if (updatesToApply[key]) {
                            // Merge with existing updates if this key already has entries in updatesToApply
                            updatesToApply[key] = {
                                ...updatesToApply[key],
                                not_trade_list: updatedNotTradeList
                            };
                        } else {
                            // Otherwise, add a new entry
                            updatesToApply[key] = {
                                not_trade_list: updatedNotTradeList
                            };
                        }
                    }

                    // console.log(`Updates to Apply for ${key}:`, updatesToApply[key]);
                }
            });

            // Handle mirror key management
            if (!isMirror && mirrorKey) {
                console.log('Handling Mirror Key Management');
                delete ownershipData[mirrorKey];
                delete lists.wanted[mirrorKey];
                updateDisplayedList(null, listsState, setListsState);
                setMirrorKey(null);
            }

            // After all updates have been accumulated, updateDetails with all keys and their specific updates
            updateDetails(allKeysToUpdate, updatesToApply);

            setLocalNotWantedList(updatedNotWantedList);
        } else {
            if (!isMirror && pokemon.ownershipStatus.mirror) {
                updateDetails(pokemon.pokemonKey, {
                    ...pokemon.ownershipStatus,
                    mirror: false,
                });
            }
        }

        setEditMode(!editMode);
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
