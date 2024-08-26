// TradeDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import WantedListDisplay from './WantedListDisplay';
import MirrorManager from './MirrorManager';
import ImageGroup from './ImageGroup';
import useImageSelection from './utils/useImageSelection.js';
import { updateDisplayedList } from './utils/listUtils.js';
import { EXCLUDE_IMAGES, INCLUDE_ONLY_IMAGES, FILTER_NAMES } from './utils/constants';
import usePokemonFiltering from './hooks/usePokemonFiltering';
import useToggleEditMode from './hooks/useToggleEditMode'; 

const TradeDetails = ({ pokemon, lists, ownershipData, sortType, sortMode }) => {
    const { not_wanted_list, wanted_filters } = pokemon.ownershipStatus;
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const [localWantedFilters, setLocalWantedFilters] = useState({ ...wanted_filters });
    const { updateDetails } = useContext(PokemonDataContext);
    const [isMirror, setIsMirror] = useState(pokemon.ownershipStatus.mirror);
    const [mirrorKey, setMirrorKey] = useState(null);
    const [listsState, setListsState] = useState(lists);
    const [pendingUpdates, setPendingUpdates] = useState({});

    const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection, setSelectedImages: setSelectedExcludeImages } = useImageSelection(EXCLUDE_IMAGES);
    const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection, setSelectedImages: setSelectedIncludeOnlyImages } = useImageSelection(INCLUDE_ONLY_IMAGES);

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

    const { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters } = usePokemonFiltering(
        listsState,
        selectedExcludeImages,
        selectedIncludeOnlyImages,
        localWantedFilters,
        setLocalNotWantedList,
        localNotWantedList
    );

    useEffect(() => {
        setLocalWantedFilters(updatedLocalWantedFilters);
    }, [updatedLocalWantedFilters]);   

    useEffect(() => {
        setLocalNotWantedList({ ...not_wanted_list });
    }, []);
    
    const { editMode, toggleEditMode } = useToggleEditMode(
        pokemon,
        ownershipData,
        isMirror,
        mirrorKey,
        setMirrorKey,
        setIsMirror,
        lists,
        listsState,
        setListsState,
        localNotWantedList,
        setLocalNotWantedList,
        localWantedFilters,
        updateDetails,
        filteredOutPokemon
    );    

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
