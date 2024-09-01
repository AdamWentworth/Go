// WantedDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './WantedDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import TradeListDisplay from './TradeListDisplay';

import { updateNotWantedList } from '../ReciprocalUpdate.jsx';

import FilterImages from '../FilterImages.jsx';
import useImageSelection from '../utils/useImageSelection';

import { EXCLUDE_IMAGES, INCLUDE_ONLY_IMAGES, FILTER_NAMES } from '../utils/constants';
import { TOOLTIP_TEXTS } from '../utils/tooltipTexts';

import useTradeFiltering from '../hooks/useTradeFiltering';

const WantedDetails = ({ pokemon, lists, ownershipData, sortType, sortMode }) => {
    const [editMode, setEditMode] = useState(false);
    const [localNotTradeList, setLocalNotTradeList] = useState({ ...pokemon.ownershipStatus.not_trade_list });
    const [pendingUpdates, setPendingUpdates] = useState({});
    const { updateDetails } = useContext(PokemonDataContext);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);

    const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection, setSelectedImages: setSelectedExcludeImages } = useImageSelection(INCLUDE_ONLY_IMAGES);
    const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection, setSelectedImages: setSelectedIncludeOnlyImages } = useImageSelection(EXCLUDE_IMAGES);

    useEffect(() => {
        const { not_trade_filters } = pokemon.ownershipStatus;
        if (not_trade_filters) {
            setSelectedIncludeOnlyImages(initializeSelection(FILTER_NAMES.slice(0, EXCLUDE_IMAGES.length), not_trade_filters));
            setSelectedExcludeImages(initializeSelection(FILTER_NAMES.slice(EXCLUDE_IMAGES.length), not_trade_filters));
        }
    }, [pokemon.ownershipStatus.not_trade_filters]);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const toggleEditMode = () => {
        if (editMode) {
            Object.keys(pendingUpdates).forEach(key => {
                updateNotWantedList(ownershipData, pokemon.pokemonKey, key, pendingUpdates[key]);
            });
            setPendingUpdates({});
            updateDetails(pokemon.pokemonKey, {
                not_trade_list: localNotTradeList
            });
        }
        setEditMode(!editMode);
    };

    const toggleReciprocalUpdates = (key, updatedNotTrade) => {
        setPendingUpdates(prev => ({ ...prev, [key]: updatedNotTrade }));
    };

    const { filteredTradeList } = useTradeFiltering(
        lists,
        selectedExcludeImages,
        selectedIncludeOnlyImages,
        localNotTradeList,
        setLocalNotTradeList,
        localNotTradeList
    );

    const filteredTradeListCount = Object.keys(filteredTradeList).length;
    const shouldShowFewLayout = isSmallScreen || filteredTradeListCount <= 15;

    return (
        <div className="wanted-details-container">
            <div className="top-row">
                <div className={shouldShowFewLayout ? "centered" : "left-side"}>
                    <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                    <div className="header-group exclude-header">
                        <h3>Exclude</h3>
                    </div>
                </div>
                {!shouldShowFewLayout && (
                    <div className="header-group include-header">
                        <h3>Include Only</h3>
                    </div>
                )}
            </div>
    
            {shouldShowFewLayout ? (
                <>
                    <div className="image-group exclude-few">
                        <FilterImages
                            images={INCLUDE_ONLY_IMAGES}
                            selectedImages={selectedExcludeImages}
                            toggleImageSelection={toggleExcludeImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(EXCLUDE_IMAGES.length).map(name => TOOLTIP_TEXTS[name])}
                        />
                    </div>
    
                    <div className="include-only-header-group">
                        <h3>Include Only</h3>
                    </div>
                    <div className="image-group include-few">
                        <FilterImages
                            images={EXCLUDE_IMAGES}
                            selectedImages={selectedIncludeOnlyImages}
                            toggleImageSelection={toggleIncludeOnlyImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.map(name => TOOLTIP_TEXTS[name])}
                        />
                    </div>
                </>
            ) : (
                <div className="image-row-container">
                    <div className="exclude-header-group image-group">
                        <FilterImages
                            images={INCLUDE_ONLY_IMAGES}
                            selectedImages={selectedExcludeImages}
                            toggleImageSelection={toggleExcludeImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.slice(EXCLUDE_IMAGES.length).map(name => TOOLTIP_TEXTS[name])}
                        />
                    </div>
                    <div className="include-only-header-group image-group">
                        <FilterImages
                            images={EXCLUDE_IMAGES}
                            selectedImages={selectedIncludeOnlyImages}
                            toggleImageSelection={toggleIncludeOnlyImageSelection}
                            editMode={editMode}
                            tooltipTexts={FILTER_NAMES.map(name => TOOLTIP_TEXTS[name])}
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