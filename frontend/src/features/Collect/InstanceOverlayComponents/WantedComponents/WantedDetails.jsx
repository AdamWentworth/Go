// WantedDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './WantedDetails.css';
import EditSaveComponent from '../EditSaveComponent.jsx';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext.js';
import TradeListDisplay from './TradeListDisplay.jsx';

import { toggleEditMode } from '../hooks/useToggleEditModeWanted.js';
import FilterImages from '../FilterImages.jsx';
import useImageSelection from '../utils/useImageSelection.js';

import { EXCLUDE_IMAGES_trade, INCLUDE_IMAGES_trade, FILTER_NAMES } from '../utils/constants.js';
import { TOOLTIP_TEXTS } from '../utils/tooltipTexts.js';

import useTradeFiltering from '../hooks/useTradeFiltering.js';

const WantedDetails = ({ pokemon, lists, ownershipData, sortType, sortMode, openTradeOverlay, variants, isEditable }) => {
    const { not_trade_list, trade_filters } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotTradeList, setLocalNotTradeList] = useState({ ...not_trade_list });
    const [localTradeFilters, setLocalTradeFilters] = useState({ ...trade_filters });
    const { updateDetails } = useContext(PokemonDataContext);
    const [listsState, setListsState] = useState(lists);
    const [pendingUpdates, setPendingUpdates] = useState({});
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);

    const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection, setSelectedImages: setSelectedExcludeImages } = useImageSelection(EXCLUDE_IMAGES_trade);
    const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection, setSelectedImages: setSelectedIncludeOnlyImages } = useImageSelection(INCLUDE_IMAGES_trade);

    const initializeSelection = (filterNames, filters) => {
        return filterNames.map(name => !!filters[name]);
    };

    useEffect(() => {
        if (trade_filters) {
            setSelectedExcludeImages(initializeSelection(FILTER_NAMES.slice(6), trade_filters));
            setSelectedIncludeOnlyImages(initializeSelection(FILTER_NAMES.slice(0, 6), trade_filters));
        }
    }, [trade_filters]);

    const { filteredTradeList, filteredOutPokemon, updatedLocalTradeFilters } = useTradeFiltering(
        listsState,
        selectedExcludeImages,
        selectedIncludeOnlyImages,
        localTradeFilters,
        setLocalNotTradeList,
        localNotTradeList
    );

    useEffect(() => {
        setLocalTradeFilters(updatedLocalTradeFilters);
    }, [updatedLocalTradeFilters]);

    useEffect(() => {
        setLocalNotTradeList({ ...not_trade_list });
    }, []);

    const handleToggleEditMode = () => toggleEditMode({
        editMode,
        setEditMode,
        localNotTradeList,
        setLocalNotTradeList,
        pokemon,
        ownershipData,
        filteredOutPokemon,
        localTradeFilters,
        updateDetails,
    });

    const toggleReciprocalUpdates = (key, updatedNotTrade) => {
        setPendingUpdates(prev => ({ ...prev, [key]: updatedNotTrade }));
    };

    const filteredTradeListCount = Object.keys(filteredTradeList).filter(key => !localNotTradeList[key]).length;

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const shouldShowFewLayout = isSmallScreen || filteredTradeListCount <= 15;

    const handleResetFilters = () => {
        setSelectedExcludeImages(EXCLUDE_IMAGES_trade.map(() => false));
        setSelectedIncludeOnlyImages(INCLUDE_IMAGES_trade.map(() => false));
        setLocalTradeFilters({});
        setLocalNotTradeList({});
    };

    const extractBaseKey = (pokemonKey) => {
        let keyParts = String(pokemonKey).split('_');
        keyParts.pop(); // Remove the UUID part if present
        return keyParts.join('_');
    };

    const handlePokemonClick = (pokemonKey) => {

        const baseKey = extractBaseKey(pokemonKey);

        const variantData = variants.find(variant => variant.pokemonKey === baseKey);
        if (!variantData) {
            console.error(`Variant not found for pokemonKey: ${pokemonKey}`);
            return;
        }

        const ownershipDataEntry = ownershipData[pokemonKey];
        if (!ownershipDataEntry) {
            console.error(`Pokemon not found in ownershipData for key: ${pokemonKey}`);
            return;
        }

        const mergedPokemonData = {
            ...variantData,
            ownershipStatus: {
                ...variantData.ownershipStatus,
                ...ownershipDataEntry,
            },
        };

        openTradeOverlay(mergedPokemonData);
    };

    return (
        <div className="wanted-details-container">
            <div className="top-row">
                <div className={shouldShowFewLayout ? "centered" : "left-side"}>
                {isEditable && (
                    <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                )}
                    <div className={`reset-container ${editMode ? 'editable' : ''}`}>
                        <img
                            src={`${process.env.PUBLIC_URL}/images/reset.png`}
                            alt="Reset Filters"
                            style={{
                                cursor: editMode ? 'pointer' : 'default',
                                width: '25px',
                                height: 'auto'
                            }}
                            onClick={editMode ? handleResetFilters : null}
                        />
                    </div>
                    <div className="header-group exclude-header">
                        <h3>Exclude</h3>
                    </div>
                </div>
                {!shouldShowFewLayout && (
                    <div className="header-group include-header">
                        <h3>Include</h3>
                    </div>
                )}
            </div>
    
            {shouldShowFewLayout ? (
                <>
                    <div className="image-group exclude-few">
                        <FilterImages
                            images={EXCLUDE_IMAGES_trade}
                            selectedImages={selectedExcludeImages}
                            toggleImageSelection={toggleExcludeImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(6).map(name => TOOLTIP_TEXTS[name])}
                        />
                    </div>
    
                    <div className="include-only-header-group">
                        <h3>Include</h3>
                    </div>
                    <div className="image-group include-few">
                        <FilterImages
                            images={INCLUDE_IMAGES_trade}
                            selectedImages={selectedIncludeOnlyImages}
                            toggleImageSelection={toggleIncludeOnlyImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(0, 6).map(name => TOOLTIP_TEXTS[name])}
                        />
                    </div>
                </>
            ) : (
                <div className="image-row-container">
                    <div className="exclude-header-group image-group">
                        <FilterImages
                            images={EXCLUDE_IMAGES_trade}
                            selectedImages={selectedExcludeImages}
                            toggleImageSelection={toggleExcludeImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(6).map(name => TOOLTIP_TEXTS[name])}
                        />
                    </div>
                    <div className="include-only-header-group image-group">
                        <FilterImages
                            images={INCLUDE_IMAGES_trade}
                            selectedImages={selectedIncludeOnlyImages}
                            toggleImageSelection={toggleIncludeOnlyImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(0, 6).map(name => TOOLTIP_TEXTS[name])}
                        />
                    </div>
                </div>
            )}
    
            <h2>For Trade List:</h2>
            <TradeListDisplay
                pokemon={pokemon}
                lists={{ trade: filteredTradeList }}
                localNotTradeList={localNotTradeList}
                setLocalNotTradeList={setLocalNotTradeList}
                editMode={editMode}
                toggleReciprocalUpdates={toggleReciprocalUpdates}
                ownershipData={ownershipData}
                sortType={sortType}
                sortMode={sortMode}
                onPokemonClick={handlePokemonClick}
            />
        </div>
    );
};

export default WantedDetails;