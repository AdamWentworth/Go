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
import useImageSelection from './utils/useImageSelection.js'

const TradeDetails = ({ pokemon, lists, ownershipData, sortType, sortMode }) => {
    const { not_wanted_list } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const { updateDetails } = useContext(PokemonDataContext);
    const [isMirror, setIsMirror] = useState(pokemon.ownershipStatus.mirror);
    const [mirrorKey, setMirrorKey] = useState(null);
    const [listsState, setListsState] = useState(lists);
    const [filteredWantedList, setFilteredWantedList] = useState(lists.wanted); // To hold the filtered list
    const [pendingUpdates, setPendingUpdates] = useState({});

    const excludeImages = [
        "/images/community_day.png",
        "/images/field_research.png",
        "/images/raid_day.png",
        "/images/legendary_raid.png",
        "/images/mega_raid.png",
        "/images/permaboosted.png"
    ];

    const includeOnlyImages = [
        "/images/shiny_icon.png",
        "/images/costume_icon.png",
        "/images/legendary.png",
        "/images/regional.png",
        "/images/location.png"
    ];

    const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection } = useImageSelection(excludeImages);
    const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection } = useImageSelection(includeOnlyImages);

    useEffect(() => {
        setIsMirror(pokemon.ownershipStatus.mirror);
    }, [pokemon.ownershipStatus.mirror]);

    useEffect(() => {
        let updatedList = { ...listsState.wanted };
        
        // Apply exclude filters
        selectedExcludeImages.forEach((isSelected, index) => {
            if (isSelected && filters[index]) {
                updatedList = filters[index](updatedList);
            }
        });

        // Apply include-only filters
        let includeOnlyApplied = false;
        selectedIncludeOnlyImages.forEach((isSelected, index) => {
            if (isSelected && filters[excludeImages.length + index]) {
                updatedList = filters[excludeImages.length + index](updatedList);
                includeOnlyApplied = true;
            }
        });

        // If no include-only filters are applied, keep the full list
        setFilteredWantedList(includeOnlyApplied ? updatedList : listsState.wanted);
    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.wanted]);

    const toggleEditMode = () => {
        if (editMode) {
            Object.keys(pendingUpdates).forEach(key => {
                if (localNotWantedList[key] !== not_wanted_list[key]) {
                    updateNotTradeList(ownershipData, pokemon.pokemonKey, key, localNotWantedList[key], isMirror);
                }
            });
            setPendingUpdates({});
            updateDetails(pokemon.pokemonKey, {
                not_wanted_list: localNotWantedList,
                mirror: isMirror,
            });

            if (!isMirror && mirrorKey) {
                delete ownershipData[mirrorKey];
                delete lists.wanted[mirrorKey];
                updateDisplayedList(null, listsState, setListsState);
                setMirrorKey(null);
            }
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
                            images={excludeImages}
                            selectedImages={selectedExcludeImages}
                            toggleImageSelection={toggleExcludeImageSelection}
                            editMode={editMode}
                        />
                    </div>
                    <div className="include-only-header-group image-group">
                        <ImageGroup
                            images={includeOnlyImages}
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
                    lists={{ wanted: filteredWantedList }} // Pass the filtered wanted list
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
