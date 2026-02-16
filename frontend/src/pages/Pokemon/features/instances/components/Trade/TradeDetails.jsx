// TradeDetails.jsx
import React, { useState, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '@/components/EditSaveComponent';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useModal } from '@/contexts/ModalContext';

import WantedListDisplay from './WantedListDisplay';

import MirrorManager from './MirrorManager';

import FilterImages from '../../FilterImages';
import useImageSelection from '../../utils/useImageSelection';
import { updateDisplayedList } from '../../utils/listUtils';

import {
  EXCLUDE_IMAGES_wanted,
  INCLUDE_IMAGES_wanted,
  FILTER_NAMES,
} from '../../utils/constants';
import { TOOLTIP_TEXTS } from '../../utils/tooltipTexts';

import useWantedFiltering from '../../hooks/useWantedFiltering';
import useToggleEditModeTrade from '../../hooks/useToggleEditModeTrade';

import PokemonActionOverlay from './PokemonActionOverlay.js';
import TradeProposal from './TradeProposal.js';

import { parsePokemonKey } from '@/utils/PokemonIDUtils';
import { getAllInstances } from '@/db/instancesDB';
import { getAllFromTradesDB } from '@/db/tradesDB';
import { shouldUpdateTradeInstances } from './shouldUpdateTradeInstances';

import UpdateForTradeModal from './UpdateForTradeModal.js';

const TradeDetails = ({
  pokemon,
  lists,
  instances,
  sortType,
  sortMode,
  openWantedOverlay,
  variants,
  isEditable,
  username
}) => {
  const instancesMap = instances ?? {};
  const { alert } = useModal();
  const { not_wanted_list, wanted_filters } = pokemon.instanceData;
  const [localNotWantedList, setLocalNotWantedList] = useState({
    ...not_wanted_list,
  });
  const [localWantedFilters, setLocalWantedFilters] = useState({
    ...wanted_filters,
  });
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const updateStatus = useInstancesStore((s) => s.updateInstanceStatus);
  const [isMirror, setIsMirror] = useState(pokemon.instanceData.mirror);
  const [mirrorKey, setMirrorKey] = useState(null);
  const [listsState, setListsState] = useState(lists);
  const [, setPendingUpdates] = useState({});
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);

  // New state variables for UpdateForTradeModal
  const [isUpdateForTradeModalOpen, setIsUpdateForTradeModalOpen] = useState(false);
  const [caughtInstancesToTrade, setCaughtInstancesToTrade] = useState([]);
  const [currentBaseKey, setCurrentBaseKey] = useState(null); // New state for baseKey

  const [myInstances, setMyInstances] = useState();

  const {
    selectedImages: selectedExcludeImages,
    toggleImageSelection: toggleExcludeImageSelection,
    setSelectedImages: setSelectedExcludeImages,
  } = useImageSelection(EXCLUDE_IMAGES_wanted);

  const {
    selectedImages: selectedIncludeOnlyImages,
    toggleImageSelection: toggleIncludeOnlyImageSelection,
    setSelectedImages: setSelectedIncludeOnlyImages,
  } = useImageSelection(INCLUDE_IMAGES_wanted);

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  // We will set these when user actually proposes the trade
  const [isTradeProposalOpen, setIsTradeProposalOpen] = useState(false);
  const [tradeClickedPokemon, setTradeClickedPokemon] = useState(null);

  const initializeSelection = (filterNames, filters) => {
    return filterNames.map((name) => !!filters[name]);
  };

  useEffect(() => {
    if (wanted_filters) {
      setSelectedExcludeImages(
        initializeSelection(
          FILTER_NAMES.slice(0, EXCLUDE_IMAGES_wanted.length),
          wanted_filters
        )
      );
      setSelectedIncludeOnlyImages(
        initializeSelection(
          FILTER_NAMES.slice(EXCLUDE_IMAGES_wanted.length),
          wanted_filters
        )
      );
    }
    setIsMirror(pokemon.instanceData.mirror);
  }, [
    pokemon.instanceData.mirror,
    setSelectedExcludeImages,
    setSelectedIncludeOnlyImages,
    wanted_filters,
  ]);

  const { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters } =
    useWantedFiltering(
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
    setLocalNotWantedList({ ...pokemon.instanceData.not_wanted_list });
  }, [pokemon.instanceData.not_wanted_list]);

  const { editMode, toggleEditMode } = useToggleEditModeTrade(
    pokemon,
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
    setPendingUpdates((prev) => ({ ...prev, [key]: updatedNotTrade }));
  };

  // Calculate the number of items in filteredWantedList excluding those in not_wanted_list
  const filteredWantedListCount = Object.keys(filteredWantedList).filter(
    (key) => !localNotWantedList[key]
  ).length;

  const extractBaseKey = (pokemonKey) => {
    let keyParts = String(pokemonKey).split('_');
    keyParts.pop(); // Remove the UUID part if present
    return keyParts.join('_');
  };

  const handleViewWantedList = () => {
    if (selectedPokemon) {
      // If user chooses "View Wanted List" from the overlay, just do what you normally do:
      handlePokemonClick(selectedPokemon.key); 
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

    // 3) Retrieve user ownership data from IndexedDB
    let userOwnershipData = [];
    try {
      userOwnershipData = await getAllInstances();
    } catch (error) {
      console.error(
        "Failed to fetch userOwnershipData from IndexedDB:",
        error
      );
      alert("Could not fetch your ownership data. Aborting trade proposal.");
      return;
    }

    // Convert the array into a keyed object using instance_id as key
    const hashedOwnershipData = userOwnershipData.reduce((acc, item) => {
      acc[item.instance_id] = item;
      return acc;
    }, {});

    console.log(hashedOwnershipData)

    // Store that object in state for passing to TradeProposal
    setMyInstances(hashedOwnershipData);

    // 4) Filter to find all instances where the baseKey matches and is_caught=true
    const caughtInstances = userOwnershipData.filter((item) => {
      const parsedCaught = parsePokemonKey(item.instance_id);
      return parsedCaught.baseKey === selectedBaseKey && item.is_caught === true;
    });

    console.log("caughtInstances after filter =>", caughtInstances);

    // 5) If there are no matches, user has no caught instance for this variant
    if (caughtInstances.length === 0) {
      alert("You do not have this Pokemon caught, so you cannot propose a trade.");
      return;
    }

    // 6) Check for instances that are also marked is_for_trade === true
    const tradeableInstances = caughtInstances.filter(
      (item) => item.is_for_trade === true
    );

    if (tradeableInstances.length > 0) {
      // 7) NEW: Check if any of the tradeable instances are already in pending trades
      try {
        const allTrades = await getAllFromTradesDB('pokemonTrades');
        
        // Filter to only pending trades
        const pendingTrades = allTrades.filter(trade => trade.trade_status === "pending");
        
        // Filter out instances that are already in pending trades
        const availableInstances = tradeableInstances.filter(instance => {
          const instanceIsInPendingTrade = pendingTrades.some(trade => 
            trade.pokemon_instance_id_user_proposed === instance.instance_id ||
            trade.pokemon_instance_id_user_accepting === instance.instance_id
          );
          return !instanceIsInPendingTrade;
        });

        if (availableInstances.length === 0) {
          alert("All instances of this Pokémon are currently involved in pending trades. Catch some more of this Pokémon to offer this trade or cancel your current pending trade.");
          return;
        }

        // Build the "matchedInstances" array with only available instances
        const baseData = { ...selectedPokemon };
        delete baseData.instanceData;

        const matchedInstances = availableInstances.map((instance) => ({
          ...baseData,
          instanceData: { ...instance },
        }));

        const selectedPokemonWithMatches = {
          matchedInstances,
        };

        setTradeClickedPokemon(selectedPokemonWithMatches);

        // Close the overlay
        closeOverlay();

        // Finally open the TradeProposal
        setIsTradeProposalOpen(true);
      } catch (error) {
        console.error("Failed to fetch or process trades data:", error);
        alert("Could not verify trade availability. Please try again.");
        return;
      }
    } else {
      // User owns it but it isn't listed for trade
      // Instead of alert, open the UpdateForTradeModal
      setCaughtInstancesToTrade(caughtInstances);
      setCurrentBaseKey(selectedBaseKey); // Set the current baseKey
      setIsUpdateForTradeModalOpen(true);
    }
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
  };

  const handleConfirmTradeUpdate = async (selectedInstanceIds) => {
    try {
      if (!shouldUpdateTradeInstances(selectedInstanceIds)) {
        setIsUpdateForTradeModalOpen(false);
        return;
      }

      // Use canonical store action so all tag/registration invariants stay consistent.
      await updateStatus(selectedInstanceIds, 'Trade');

      // Close the modal
      setIsUpdateForTradeModalOpen(false);

      // Proceed with the trade proposal
      // Re-run handleProposeTrade or implement the logic here
      handleProposeTrade(); // Be cautious to avoid infinite loops
    } catch (error) {
      console.error("Failed to update instances for trade:", error);
      alert("There was an error updating your instances for trade. Please try again.");
    }
  };

  const handleCancelTradeUpdate = () => {
    // Simply close the modal without making any changes
    setIsUpdateForTradeModalOpen(false);
  };

  // When not in edit mode, clicking a Pokémon's thumbnail
  // will open the PokemonActionOverlay
  const handlePokemonClickModified = (pokemonKey, pokemonData) => {
    if (isEditable) {
      // If we can edit, do the default logic
      handlePokemonClick(pokemonKey);
    } else {
      // Otherwise, open the overlay
      setSelectedPokemon(pokemonData);
      setIsOverlayOpen(true);
    }
  };

  const handlePokemonClick = (pokemonKey) => {
    const baseKey = extractBaseKey(pokemonKey);

    // 1) Find the variant data
    const variantData = variants.find(
      (variant) => (variant.variant_id ?? variant.pokemonKey) === baseKey
    );
    if (!variantData) {
      console.error(`Variant not found for pokemonKey: ${pokemonKey}`);
      return;
    }

    // 2) Merge variant with instances
    const instanceEntry = instancesMap[pokemonKey];
    if (!instanceEntry) {
      console.error(`No instance data found for key: ${pokemonKey}`);
      return;
    }

    const mergedPokemonData = {
      ...variantData,
      variant_id: variantData.variant_id ?? baseKey,
      instanceData: {
        ...variantData.instanceData,
        ...instanceEntry,
      },
    };

    // 3) This is your existing "openWantedOverlay" for the clicked Pokémon
    // console.log(mergedPokemonData)
    openWantedOverlay(mergedPokemonData);
  };

  // Keep track of window resizing
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
              <EditSaveComponent
                editMode={editMode}
                toggleEditMode={toggleEditMode}
                isEditable={isEditable}
              />
              {!isMirror && (
                <div
                  className={`reset-container ${editMode ? 'editable' : ''}`}
                >
                  <img
                    src={`/images/reset.png`}
                    alt="Reset Filters"
                    style={{
                      cursor: editMode ? 'pointer' : 'default',
                      width: '25px',
                      height: 'auto',
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
            <MirrorManager
              pokemon={pokemon}
              instances={instancesMap}
              lists={lists}
              isMirror={isMirror}
              setIsMirror={setIsMirror}
              setMirrorKey={setMirrorKey}
              // Pass isEditable as the editMode prop so that when viewing (isEditable is false)
              // the toggle logic inside MirrorManager is disabled.
              editMode={isEditable}
              updateDisplayedList={(newData) =>
                updateDisplayedList(newData, localNotWantedList, setListsState)
              }
              updateDetails={updateDetails}
            />
          </div>
        </div>

        {/* Only show the filters if it's not a Mirror */}
        {!isMirror &&
          (!shouldShowFewLayout ? (
            <div className="image-row-container">
              <div className="exclude-header-group image-group">
                <FilterImages
                  images={EXCLUDE_IMAGES_wanted}
                  selectedImages={selectedExcludeImages}
                  toggleImageSelection={toggleExcludeImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.map((name) => TOOLTIP_TEXTS[name])}
                />
              </div>
              <div className="include-only-header-group image-group">
                <FilterImages
                  images={INCLUDE_IMAGES_wanted}
                  selectedImages={selectedIncludeOnlyImages}
                  toggleImageSelection={toggleIncludeOnlyImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.slice(
                    EXCLUDE_IMAGES_wanted.length
                  ).map((name) => TOOLTIP_TEXTS[name])}
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
                  tooltipTexts={FILTER_NAMES.map((name) => TOOLTIP_TEXTS[name])}
                />
              </div>
              <div className="include-only-header-group include-few">
                <h3>Include</h3>
                <FilterImages
                  images={INCLUDE_IMAGES_wanted}
                  selectedImages={selectedIncludeOnlyImages}
                  toggleImageSelection={toggleIncludeOnlyImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.slice(
                    EXCLUDE_IMAGES_wanted.length
                  ).map((name) => TOOLTIP_TEXTS[name])}
                />
              </div>
            </>
          ))}

        <div className="wanted">
          <h2>Wanted List:</h2>
          <WantedListDisplay
            pokemon={pokemon}
            lists={{ wanted: filteredWantedList }}
            localNotWantedList={localNotWantedList}
            isMirror={isMirror}
            mirrorKey={mirrorKey}
            setLocalNotWantedList={setLocalNotWantedList}
            editMode={editMode}
            toggleReciprocalUpdates={toggleReciprocalUpdates}
            sortType={sortType}
            sortMode={sortMode}
            onPokemonClick={(key) => {
              // We fetch the entire data for the clicked Pokémon
              // so we can store it in selectedPokemon
              const pokemonData = filteredWantedList[key];
              handlePokemonClickModified(key, pokemonData);
            }}
            variants={variants}
          />
        </div>
      </div>

      {/* The overlay that appears when not in edit mode */}
      <PokemonActionOverlay
        isOpen={isOverlayOpen}
        onClose={closeOverlay}
        onViewWantedList={handleViewWantedList}
        onProposeTrade={handleProposeTrade}
        pokemon={selectedPokemon}
      />

      {/* If the user actually proposes a trade, open TradeProposal */}
      {isTradeProposalOpen && (
        <TradeProposal
          passedInPokemon={pokemon}      // The "parent" Pokémon from which we came
          clickedPokemon={tradeClickedPokemon} // The user’s matches from their DB
          wantedPokemon={selectedPokemon} // <--- We pass the *clicked* Pokémon as wantedPokemon
          onClose={() => {
            setIsTradeProposalOpen(false);
            setTradeClickedPokemon(null);
          }}
          myInstances={myInstances}
          instances={instancesMap}
          username={username}
        />
      )}

      {/* Render the UpdateForTradeModal when needed */}
      {isUpdateForTradeModalOpen && (
        <UpdateForTradeModal
          caughtInstances={caughtInstancesToTrade}
          baseKey={currentBaseKey} // Pass the baseKey here
          onClose={handleCancelTradeUpdate}
          onConfirm={handleConfirmTradeUpdate}
        />
      )}
    </div>
  );
};

export default TradeDetails;
