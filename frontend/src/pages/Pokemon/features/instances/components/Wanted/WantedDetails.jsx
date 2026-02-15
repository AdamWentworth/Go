// WantedDetails.jsx

import React, { useState, useEffect, useMemo } from 'react';
import './WantedDetails.css';
import EditSaveComponent from '@/components/EditSaveComponent';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import TradeListDisplay from './TradeListDisplay.jsx';

import { toggleEditMode } from '../../hooks/useToggleEditModeWanted.js';
import FilterImages from '../../FilterImages.jsx';
import useImageSelection from '../../utils/useImageSelection';

import { EXCLUDE_IMAGES_trade, INCLUDE_IMAGES_trade, FILTER_NAMES } from '../../utils/constants';
import { TOOLTIP_TEXTS } from '../../utils/tooltipTexts';

import useTradeFiltering from '../../hooks/useTradeFiltering.js';

const WantedDetails = ({
  pokemon,
  lists,
  instances,
  sortType,
  sortMode,
  openTradeOverlay,
  variants,
  isEditable
}) => {
  const instancesMap = instances ?? {};
  // Defensive defaults in case instanceData is not ready yet.
  const not_trade_list = pokemon?.instanceData?.not_trade_list ?? {};
  const trade_filters  = pokemon?.instanceData?.trade_filters  ?? {};

  const [editMode, setEditMode] = useState(false);
  const [localNotTradeList, setLocalNotTradeList] = useState({ ...not_trade_list });
  const [localTradeFilters, setLocalTradeFilters] = useState({ ...trade_filters });
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);

  // Synthesize a top-level "trade" bucket if it doesn’t exist by selecting
  // items from CAUGHT that have is_for_trade = true.
  const listsWithTrade = useMemo(() => {
    const caught = lists?.caught ?? {};
    const trade = lists?.trade ?? Object.fromEntries(
      Object.entries(caught).filter(([, it]) => it?.is_for_trade)
    );
    return { ...(lists || {}), trade };
  }, [lists]);

  const [listsState, setListsState] = useState(listsWithTrade);
  useEffect(() => { setListsState(listsWithTrade); }, [listsWithTrade]);

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  // Image selection states
  const {
    selectedImages: selectedExcludeImages,
    toggleImageSelection: toggleExcludeImageSelection,
    setSelectedImages: setSelectedExcludeImages
  } = useImageSelection(INCLUDE_IMAGES_trade);

  const {
    selectedImages: selectedIncludeOnlyImages,
    toggleImageSelection: toggleIncludeOnlyImageSelection,
    setSelectedImages: setSelectedIncludeOnlyImages
  } = useImageSelection(EXCLUDE_IMAGES_trade);

  const initializeSelection = (filterNames, filters) => {
    return filterNames.map((name) => !!filters[name]);
  };

  useEffect(() => {
    if (trade_filters) {
      setSelectedExcludeImages(
        initializeSelection(FILTER_NAMES.slice(6), trade_filters)
      );
      setSelectedIncludeOnlyImages(
        initializeSelection(FILTER_NAMES.slice(0, 6), trade_filters)
      );
    }
  }, [trade_filters, setSelectedExcludeImages, setSelectedIncludeOnlyImages]);

  const {
    filteredTradeList,
    filteredOutPokemon,
    updatedLocalTradeFilters
  } = useTradeFiltering(
    listsState,
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    localTradeFilters,
    setLocalNotTradeList,
    localNotTradeList,
    editMode
  );

  useEffect(() => {
    setLocalTradeFilters(updatedLocalTradeFilters);
  }, [updatedLocalTradeFilters]);

  useEffect(() => {
    setLocalNotTradeList({ ...(pokemon?.instanceData?.not_trade_list ?? {}) });
  }, [pokemon?.instanceData?.not_trade_list]);

  const handleToggleEditMode = () =>
    toggleEditMode({
      editMode,
      setEditMode,
      localNotTradeList,
      setLocalNotTradeList,
      pokemon,
      instances,
      filteredOutPokemon,
      localTradeFilters,
      updateDetails
    });

  const toggleReciprocalUpdates = (key, updatedNotTrade) => {
    // Keep as-is for now; used by TradeListDisplay
    // eslint-disable-next-line no-unused-vars
    setPendingUpdates((prev) => ({ ...prev, [key]: updatedNotTrade }));
  };

  const [pendingUpdates, setPendingUpdates] = useState({});

  const filteredTradeListCount = Object.keys(filteredTradeList || {}).filter(
    (key) => !(localNotTradeList || {})[key]
  ).length;

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
    if (!editMode) return;
    setSelectedExcludeImages(EXCLUDE_IMAGES_trade.map(() => false));
    setSelectedIncludeOnlyImages(INCLUDE_IMAGES_trade.map(() => false));
    setLocalTradeFilters({});
    setLocalNotTradeList({});
  };

  const extractBaseKey = (pokemonKey) => {
    const parts = String(pokemonKey).split('_');
    parts.pop(); // Remove UUID part if present
    return parts.join('_');
  };

  const handlePokemonClick = (pokemonKey) => {
    const baseKey = extractBaseKey(pokemonKey);
    const variantData =
      (variants || []).find(
        (variant) => (variant.variant_id ?? variant.pokemonKey) === baseKey,
      );
    if (!variantData) {
      console.error(`Variant not found for pokemonKey: ${pokemonKey}`);
      return;
    }
    const instanceEntry = instancesMap?.[pokemonKey];
    if (!instanceEntry) {
      console.error(`Pokemon instance not found for key: ${pokemonKey}`);
      return;
    }
    const mergedPokemonData = {
      ...variantData,
      variant_id: variantData.variant_id ?? baseKey,
      ownershipStatus: {
        ...variantData.ownershipStatus,
        ...instanceEntry
      }
    };
    openTradeOverlay(mergedPokemonData);
  };

  return (
    <div>
      <div
        className={`wanted-details-grid ${shouldShowFewLayout ? 'few-layout' : 'many-layout'}`}
      >
        {/* -- EDIT/SAVE -- */}
        <div className="edit-save">
          <EditSaveComponent
            editMode={editMode}
            toggleEditMode={handleToggleEditMode}
            isEditable={isEditable}
          />
        </div>

        {/* -- EXCLUDE HEADER -- */}
        <div className="exclude-header">
          <h3>Exclude</h3>
        </div>

        {/* -- INCLUDE HEADER -- */}
        <div className="include-header">
          <h3>Include</h3>
        </div>

        {/* -- EXCLUDE IMAGES -- */}
        <div className="exclude-images">
          <FilterImages
            images={EXCLUDE_IMAGES_trade}
            selectedImages={selectedExcludeImages}
            toggleImageSelection={toggleExcludeImageSelection}
            editMode={editMode}
            tooltipTexts={FILTER_NAMES.slice(6).map((name) => TOOLTIP_TEXTS[name])}
          />
        </div>

        {/* -- INCLUDE IMAGES -- */}
        <div className="include-images">
          <FilterImages
            images={INCLUDE_IMAGES_trade}
            selectedImages={selectedIncludeOnlyImages}
            toggleImageSelection={toggleIncludeOnlyImageSelection}
            editMode={editMode}
            tooltipTexts={FILTER_NAMES.slice(0, 6).map((name) => TOOLTIP_TEXTS[name])}
          />
        </div>

        {/* -- RESET BUTTON -- */}
        {isEditable && (
          <div className="reset">
            <img
              src={`/images/reset.png`}
              alt="Reset Filters"
              onClick={handleResetFilters}
            />
          </div>
        )}
      </div>

      {/* -- FOR TRADE (header + list) -- */}
      <div className="for-trade">
        <h2>For Trade List:</h2>
        <TradeListDisplay
          pokemon={pokemon}
          lists={{ trade: filteredTradeList || {} }}
          localNotTradeList={localNotTradeList}
          setLocalNotTradeList={setLocalNotTradeList}
          editMode={editMode}
          toggleReciprocalUpdates={toggleReciprocalUpdates}
          sortType={sortType}
          sortMode={sortMode}
          onPokemonClick={handlePokemonClick}
        />
      </div>
    </div>
  );
};

export default WantedDetails;
