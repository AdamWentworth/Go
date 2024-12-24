// TradeDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent.jsx';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext.js';
import WantedListDisplay from './WantedListDisplay.jsx';

import MirrorManager from './MirrorManager.jsx';

import FilterImages from '../FilterImages.jsx';
import useImageSelection from '../utils/useImageSelection.js';
import { updateDisplayedList } from '../utils/listUtils.js';

import { EXCLUDE_IMAGES_wanted, INCLUDE_IMAGES_wanted, FILTER_NAMES } from '../utils/constants.js';
import { TOOLTIP_TEXTS } from '../utils/tooltipTexts.js';

import useWantedFiltering from '../hooks/useWantedFiltering.js';
import useToggleEditModeTrade from '../hooks/useToggleEditModeTrade.js'; 

import PokemonActionOverlay from './PokemonActionOverlay.jsx'; // Import the new component
import TradeProposal from './TradeProposal.jsx'; // Adjust the path as necessary

import { parsePokemonKey } from '../../../../utils/PokemonIDUtils.js'; 
import { getAllFromDB, OWNERSHIP_DATA_STORE } from '../../../../services/indexedDB.js';

const TradeDetails = ({ pokemon, lists, ownershipData, sortType, sortMode, onClose, openWantedOverlay, variants, isEditable }) => {
    const { not_wanted_list, wanted_filters } = pokemon.ownershipStatus;
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const [localWantedFilters, setLocalWantedFilters] = useState({ ...wanted_filters });
    const { updateDetails } = useContext(PokemonDataContext);
    const [isMirror, setIsMirror] = useState(pokemon.ownershipStatus.mirror);
    const [mirrorKey, setMirrorKey] = useState(null);
    const [listsState, setListsState] = useState(lists);
    const [pendingUpdates, setPendingUpdates] = useState({});
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);

    const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection, setSelectedImages: setSelectedExcludeImages } = useImageSelection(EXCLUDE_IMAGES_wanted);
    const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection, setSelectedImages: setSelectedIncludeOnlyImages } = useImageSelection(INCLUDE_IMAGES_wanted);

    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [isTradeProposalOpen, setIsTradeProposalOpen] = useState(false);
    const [tradeClickedPokemon, setTradeClickedPokemon] = useState(null);

    const initializeSelection = (filterNames, filters) => {
        return filterNames.map(name => !!filters[name]);
    };

    useEffect(() => {
        if (wanted_filters) {
            setSelectedExcludeImages(initializeSelection(FILTER_NAMES.slice(0, EXCLUDE_IMAGES_wanted.length), wanted_filters));
            setSelectedIncludeOnlyImages(initializeSelection(FILTER_NAMES.slice(EXCLUDE_IMAGES_wanted.length), wanted_filters));
        }

        setIsMirror(pokemon.ownershipStatus.mirror);
    }, [pokemon.ownershipStatus.mirror, wanted_filters]);

    const { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters } = useWantedFiltering(
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
    
    const { editMode, toggleEditMode } = useToggleEditModeTrade(
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

    // Calculate the number of items in filteredWantedList excluding those in the not_wanted_list
    const filteredWantedListCount = Object.keys(filteredWantedList).filter(key => !localNotWantedList[key]).length;

    const extractBaseKey = (pokemonKey) => {
        let keyParts = String(pokemonKey).split('_');
        keyParts.pop(); // Remove the UUID part if present
        return keyParts.join('_');
    };

    const handleViewWantedList = () => {
        if (selectedPokemon) {
            handlePokemonClick(selectedPokemon.key); // Proceed with original click handler
            closeOverlay();
        }
    };

    const handleProposeTrade = async () => {
        // 1) Check if a Pokémon is actually selected
        if (!selectedPokemon) {
            console.log("[TradeDetails] No selectedPokemon. Aborting trade proposal.");
            return;
        }
    
        // 2) Parse the selected Pokémon's key to extract the baseKey
        const parsedSelected = parsePokemonKey(selectedPokemon.key);
        const { baseKey: selectedBaseKey } = parsedSelected;
    
        // 3) Retrieve *my* ownership data from IndexedDB
        let userOwnershipData = [];
        try {
            userOwnershipData = await getAllFromDB(OWNERSHIP_DATA_STORE);
        } catch (error) {
            console.error("Failed to fetch userOwnershipData from IndexedDB:", error);
            alert("Could not fetch your ownership data. Aborting trade proposal.");
            return;
        }
    
        // 4) Filter to find all instances where the baseKey matches and is_owned === true
        const ownedInstances = userOwnershipData.filter((item) => {
            const parsedOwned = parsePokemonKey(item.instance_id);
            return parsedOwned.baseKey === selectedBaseKey && item.is_owned === true;
        });
    
        console.log("ownedInstances after filter =>", ownedInstances);
    
        // 5) If there are no matches, the user does not own this Pokémon
        if (ownedInstances.length === 0) {
            alert("You cannot offer this trade, you do not own this Pokémon.");
            return;
        }
    
        // 6) Check for instances that are also marked as is_for_trade
        const tradeableInstances = ownedInstances.filter(item => item.is_for_trade === true);
    
        if (tradeableInstances.length > 0) {
            // Here’s where we build the "matchedInstances" array.
    
            // We can remove certain leftover ownership fields from selectedPokemon 
            // if they conflict with new ones. But typically, just keep your base data:
            const {
              ownershipStatus,  // We'll ignore or remove existing ownership data
              ...baseData
            } = selectedPokemon;
    
            // 7) Construct a new array of "full Pokémon objects"
            //    Each element has the same base data but a unique ownershipStatus
            const matchedInstances = tradeableInstances.map((instance) => ({
              ...baseData,               // all the species/base data from the selected Pokemon
              ownershipStatus: { ...instance }, // instance-specific data
            }));
    
            // 8) Build our final clickedPokemon object:
            const selectedPokemonWithMatches = {
                matchedInstances, // array of fully merged objects
            };
    
            console.log(
              "[TradeDetails] Constructed selectedPokemonWithMatches:",
              selectedPokemonWithMatches
            );
    
            // 9) Proceed with the existing trade proposal flow
            setTradeClickedPokemon(selectedPokemonWithMatches);
    
            // Close the PokemonActionOverlay
            closeOverlay();
    
            // Open the TradeProposal component
            setIsTradeProposalOpen(true);
        } else {
            // User owns the Pokémon but does not have it listed for trade
            alert("You own this Pokémon but you do not have it listed for Trade.");
        }
    };    
    
    const closeOverlay = () => {
        setIsOverlayOpen(false);
        setSelectedPokemon(null);
    };
    
    const handlePokemonClickModified = (pokemonKey, pokemonData) => {
        if (isEditable) {
            // If editable, proceed with the original click handler
            handlePokemonClick(pokemonKey);
        } else {
            // If not editable, open the overlay
            setSelectedPokemon(pokemonData);
            setIsOverlayOpen(true);
        }
    };

    const handlePokemonClick = (pokemonKey) => {
        // Extract the base key using the existing function
        const baseKey = extractBaseKey(pokemonKey);
        
        // Look up in variants
        const variantData = variants.find(variant => variant.pokemonKey === baseKey);
        if (!variantData) {
            console.error(`Variant not found for pokemonKey: ${pokemonKey}`);
            return;
        }
        
        // Look up in ownershipData
        const ownershipDataEntry = ownershipData[pokemonKey];
        if (!ownershipDataEntry) {
            console.error(`Pokemon not found in ownershipData for key: ${pokemonKey}`);
            return;
        }
        
        // Merge the ownershipData into the ownershipStatus of the variant
        const mergedPokemonData = {
            ...variantData,
            ownershipStatus: {
                ...variantData.ownershipStatus,
                ...ownershipDataEntry,
            },
        };
        
        // Open the Wanted overlay with the merged data
        openWantedOverlay(mergedPokemonData);
    };

    // Effect to monitor screen width changes
    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const shouldShowFewLayout = isSmallScreen || filteredWantedListCount <= 15;

    const handleResetFilters = () => {
        setSelectedExcludeImages(EXCLUDE_IMAGES_wanted.map(() => false));
        setSelectedIncludeOnlyImages(INCLUDE_IMAGES_wanted.map(() => false));
        setLocalWantedFilters({});
        setLocalNotWantedList({});
    };    

    return (
        <div>
        <div className="trade-details-container">
            <div className={`top-row ${isMirror ? 'few-wanted' : ''}`}>
                {isEditable && (
                    <div className="edit-save-container">
                        <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                        {!isMirror && (
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
                        )}
                    </div>
                )}
                {!isMirror ? (
                    !shouldShowFewLayout ? (
                        <>
                            <div className="header-group">
                                <h3>Exclude</h3>
                            </div>
                            <div className="header-group">
                                <h3>Include</h3>
                            </div>
                        </>
                    ) : (
                        <div className="header-group include-few">
                            <h3>Exclude</h3>
                        </div>
                    )
                ) : (
                    <div className="spacer"></div>
                )}
                <div className="mirror">
                    {isEditable && (
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
                    )}
                </div>
            </div>
    
            {!isMirror && (
                !shouldShowFewLayout ? (
                    <div className="image-row-container">
                        <div className="exclude-header-group image-group">
                            <FilterImages
                                images={EXCLUDE_IMAGES_wanted}
                                selectedImages={selectedExcludeImages}
                                toggleImageSelection={toggleExcludeImageSelection}
                                editMode={editMode}
                                tooltipTexts={FILTER_NAMES.map(name => TOOLTIP_TEXTS[name])}
                            />
                        </div>
                        <div className="include-only-header-group image-group">
                            <FilterImages
                                images={INCLUDE_IMAGES_wanted}
                                selectedImages={selectedIncludeOnlyImages}
                                toggleImageSelection={toggleIncludeOnlyImageSelection}
                                editMode={editMode}
                                tooltipTexts={FILTER_NAMES.slice(EXCLUDE_IMAGES_wanted.length).map(name => TOOLTIP_TEXTS[name])}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="exclude-header-group image-group exclude-few">
                            <FilterImages
                                images={EXCLUDE_IMAGES_wanted}
                                selectedImages={selectedExcludeImages}
                                toggleImageSelection={toggleExcludeImageSelection}
                                editMode={editMode}
                                tooltipTexts={FILTER_NAMES.map(name => TOOLTIP_TEXTS[name])}
                            />
                        </div>
                        <div className="include-only-header-group include-few">
                            <h3>Include</h3>
                            <FilterImages
                                images={INCLUDE_IMAGES_wanted}
                                selectedImages={selectedIncludeOnlyImages}
                                toggleImageSelection={toggleIncludeOnlyImageSelection}
                                editMode={editMode}
                                tooltipTexts={FILTER_NAMES.slice(EXCLUDE_IMAGES_wanted.length).map(name => TOOLTIP_TEXTS[name])}
                            />
                        </div>
                    </>
                )
            )}
        
            <div className='wanted'>
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
                    onPokemonClick={(key) => {
                        // Pass the entire Pokémon data if needed
                        const pokemonData = filteredWantedList[key];
                        handlePokemonClickModified(key, pokemonData);
                    }}
                    variants={variants}
                />
            </div>
        </div>
        <PokemonActionOverlay
            isOpen={isOverlayOpen}
            onClose={closeOverlay}
            onViewWantedList={handleViewWantedList}
            onProposeTrade={handleProposeTrade}
            pokemon={selectedPokemon}
            ownershipData={ownershipData}
        />
        {isTradeProposalOpen && (
            <TradeProposal
                passedInPokemon={pokemon} 
                clickedPokemon={tradeClickedPokemon} 
                onClose={() => {
                setIsTradeProposalOpen(false);
                setTradeClickedPokemon(null); 
                }}
            />
            )}
        </div>
    );        
};

export default TradeDetails;