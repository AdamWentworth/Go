// WantedDetails.tsx

import React, { useState, useEffect } from 'react';
import './WantedDetails.css';
import EditSaveComponent from '@/components/EditSaveComponent';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import TradeListDisplay from './TradeListDisplay';
import { toggleEditMode } from '../../hooks/useToggleEditModeWanted';
import FilterImages from '../../FilterImages';
import useImageSelection from '../../utils/useImageSelection';
import { EXCLUDE_IMAGES_trade, INCLUDE_IMAGES_trade, FILTER_NAMES } from '../../utils/constants';
import { TOOLTIP_TEXTS } from '../../utils/tooltipTexts';
import useTradeFiltering from '../../hooks/useTradeFiltering';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { TagBuckets, TagItem } from '@/types/tags';
import type { InstancesData } from '@/types/instances';
import type { SortType, SortMode } from '@/types/sort';

interface WantedDetailsProps {
  pokemon: PokemonVariant;
  lists: TagBuckets;
  instances: InstancesData;
  sortType: SortType;
  sortMode: SortMode;
  openTradeOverlay: (mergedPokemonData: any) => void;
  variants: any[];
  isEditable: boolean;
}

const WantedDetails: React.FC<WantedDetailsProps> = ({
  pokemon,
  lists,
  instances,
  sortType,
  sortMode,
  openTradeOverlay,
  variants,
  isEditable,
}) => {
  const { not_trade_list = {}, trade_filters = {} } = pokemon.instanceData ?? {};
  const [editMode, setEditMode] = useState(false);
  const [localNotTradeList, setLocalNotTradeList] = useState<Record<string, boolean>>(not_trade_list as Record<string, boolean>);
  const [localTradeFilters, setLocalTradeFilters] = useState<Record<string, boolean>>(trade_filters as Record<string, boolean>);
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const listsState = { trade: lists.trade }; // simple object, no useState
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);

  const { selectedImages: selectedExcludeImages, toggleImageSelection: toggleExcludeImageSelection, setSelectedImages: setSelectedExcludeImages } = useImageSelection(INCLUDE_IMAGES_trade);
  const { selectedImages: selectedIncludeOnlyImages, toggleImageSelection: toggleIncludeOnlyImageSelection, setSelectedImages: setSelectedIncludeOnlyImages } = useImageSelection(EXCLUDE_IMAGES_trade);

  const initializeSelection = (filterNames: string[], filters: Record<string, boolean>) => {
    return filterNames.map(name => !!filters[name]);
  };

  useEffect(() => {
    if (trade_filters) {
      setSelectedExcludeImages(initializeSelection(FILTER_NAMES.slice(6), trade_filters as Record<string, boolean>));
      setSelectedIncludeOnlyImages(initializeSelection(FILTER_NAMES.slice(0, 6), trade_filters as Record<string, boolean>));
    }
  }, [trade_filters]);

  const { filteredTradeList, filteredOutPokemon, updatedLocalTradeFilters } = useTradeFiltering(
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
    setLocalNotTradeList(not_trade_list as Record<string, boolean>);
  }, [not_trade_list]);

  const handleToggleEditMode = () => toggleEditMode({
    editMode,
    setEditMode,
    localNotTradeList,
    setLocalNotTradeList,
    pokemon,
    instances,
    filteredOutPokemon,
    localTradeFilters,
    updateDetails: updateDetails as any, // keep temporary until updateDetails type is adjusted
  });

  const handleResetFilters = () => {
    if (!editMode) return;
    setSelectedExcludeImages(EXCLUDE_IMAGES_trade.map(() => false));
    setSelectedIncludeOnlyImages(INCLUDE_IMAGES_trade.map(() => false));
    setLocalTradeFilters({});
    setLocalNotTradeList({});
  };

  const extractBaseKey = (pokemonKey: string): string => {
    const keyParts = pokemonKey.split('_');
    keyParts.pop();
    return keyParts.join('_');
  };

  const handlePokemonClick = (pokemonKey: string) => {
    const baseKey = extractBaseKey(pokemonKey);
    const variantData = variants.find(variant => variant.pokemonKey === baseKey);
    if (!variantData) {
      console.error(`Variant not found for pokemonKey: ${pokemonKey}`);
      return;
    }
    const instancesEntry = instances[pokemonKey];
    if (!instancesEntry) {
      console.error(`Pokemon not found in instances for key: ${pokemonKey}`);
      return;
    }
    const mergedPokemonData = {
      ...variantData,
      pokemonKey,
      instanceData: {
        ...variantData.instanceData,
        ...instancesEntry,
      },
    };
    openTradeOverlay(mergedPokemonData);
  };

  const filteredTradeListCount = Object.keys(filteredTradeList).filter(key => !localNotTradeList[key]).length;
  const shouldShowFewLayout = isSmallScreen || filteredTradeListCount <= 15;

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div>
      <div className={`wanted-details-grid ${shouldShowFewLayout ? 'few-layout' : 'many-layout'}`}>
        <div className="edit-save">
          <EditSaveComponent editMode={editMode} toggleEditMode={handleToggleEditMode} isEditable={isEditable} />
        </div>

        <div className="exclude-header"><h3>Exclude</h3></div>
        <div className="include-header"><h3>Include</h3></div>

        <div className="exclude-images">
          <FilterImages
            images={EXCLUDE_IMAGES_trade}
            selectedImages={selectedExcludeImages}
            toggleImageSelection={toggleExcludeImageSelection}
            editMode={editMode}
            tooltipTexts={FILTER_NAMES.slice(6).map(name => TOOLTIP_TEXTS[name as keyof typeof TOOLTIP_TEXTS])}
          />
        </div>

        <div className="include-images">
          <FilterImages
            images={INCLUDE_IMAGES_trade}
            selectedImages={selectedIncludeOnlyImages}
            toggleImageSelection={toggleIncludeOnlyImageSelection}
            editMode={editMode}
            tooltipTexts={FILTER_NAMES.slice(0, 6).map(name => TOOLTIP_TEXTS[name as keyof typeof TOOLTIP_TEXTS])}
          />
        </div>

        {isEditable && (
          <div className="reset">
            <img src="/images/reset.png" alt="Reset Filters" onClick={handleResetFilters} />
          </div>
        )}
      </div>

      <div className="for-trade">
        <h2>For Trade List:</h2>
        <TradeListDisplay
          pokemon={pokemon}
          lists={{
            owned: {},
            trade: filteredTradeList,
            wanted: {},
            unowned: {},
          }}
          localNotTradeList={localNotTradeList}
          setLocalNotTradeList={setLocalNotTradeList}
          editMode={editMode}
          toggleReciprocalUpdates={(key, updatedNotTrade) => {
            setLocalNotTradeList(prev => ({ ...prev, [key]: updatedNotTrade }));
          }}
          sortType={sortType}
          sortMode={sortMode}
          onPokemonClick={handlePokemonClick}
        />
      </div>
    </div>
  );
};

export default WantedDetails;
