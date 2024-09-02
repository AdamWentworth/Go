// WantedDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './WantedDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import TradeListDisplay from './TradeListDisplay';

import { toggleEditMode } from '../hooks/useToggleEditModeWanted'; // Import the new module
import FilterImages from '../FilterImages.jsx';
import useImageSelection from '../utils/useImageSelection';

import { EXCLUDE_IMAGES_trade, INCLUDE_IMAGES_trade, FILTER_NAMES } from '../utils/constants';
import { TOOLTIP_TEXTS } from '../utils/tooltipTexts';

import useTradeFiltering from '../hooks/useTradeFiltering';

const WantedDetails = ({ pokemon, lists, ownershipData, sortType, sortMode }) => {
    const { not_trade_list, trade_filters } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotTradeList, setLocalNotTradeList] = useState({ ...not_trade_list });
    const [localTradeFilters, setLocalTradeFilters] = useState({ ...trade_filters });
    const { updateDetails } = useContext(PokemonDataContext);
    const [listsState, setListsState] = useState(lists);
    const [pendingUpdates, setPendingUpdates] = useState({});
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);

    // Swap the images used for the states
    const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection, setSelectedImages: setSelectedExcludeImages } = useImageSelection(EXCLUDE_IMAGES_trade); // Previously was INCLUDE_IMAGES_trade
    const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection, setSelectedImages: setSelectedIncludeOnlyImages } = useImageSelection(INCLUDE_IMAGES_trade); // Previously was EXCLUDE_IMAGES_trade

    const initializeSelection = (filterNames, filters) => {
        return filterNames.map(name => !!filters[name]);
    };

    useEffect(() => {
        if (trade_filters) {
            // Note: Use the first half of FILTER_NAMES for exclude images and the second half for include images
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

    // Calculate the number of items in filteredTradeList excluding those in the not_trade_list
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

    return (
        <div className="wanted-details-container">
            <div className="top-row">
                <div className={shouldShowFewLayout ? "centered" : "left-side"}>
                    <EditSaveComponent editMode={editMode} toggleEditMode={handleToggleEditMode} />
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
                            images={EXCLUDE_IMAGES_trade} // Previously was INCLUDE_IMAGES_trade
                            selectedImages={selectedExcludeImages}
                            toggleImageSelection={toggleExcludeImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(6).map(name => TOOLTIP_TEXTS[name])} // Slice for exclude tooltips
                        />
                    </div>
    
                    <div className="include-only-header-group">
                        <h3>Include</h3>
                    </div>
                    <div className="image-group include-few">
                        <FilterImages
                            images={INCLUDE_IMAGES_trade} // Previously was EXCLUDE_IMAGES_trade
                            selectedImages={selectedIncludeOnlyImages}
                            toggleImageSelection={toggleIncludeOnlyImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(0, 6).map(name => TOOLTIP_TEXTS[name])} // Slice for include tooltips
                        />
                    </div>
                </>
            ) : (
                <div className="image-row-container">
                    <div className="exclude-header-group image-group">
                        <FilterImages
                            images={EXCLUDE_IMAGES_trade} // Previously was INCLUDE_IMAGES_trade
                            selectedImages={selectedExcludeImages}
                            toggleImageSelection={toggleExcludeImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(6).map(name => TOOLTIP_TEXTS[name])} // Slice for exclude tooltips
                        />
                    </div>
                    <div className="include-only-header-group image-group">
                        <FilterImages
                            images={INCLUDE_IMAGES_trade} // Previously was EXCLUDE_IMAGES_trade
                            selectedImages={selectedIncludeOnlyImages}
                            toggleImageSelection={toggleIncludeOnlyImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(0, 6).map(name => TOOLTIP_TEXTS[name])} // Slice for include tooltips
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
            />
        </div>
    );
};

export default WantedDetails;