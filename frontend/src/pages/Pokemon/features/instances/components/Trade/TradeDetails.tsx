// TradeDetails.jsx
import React, { useState, useEffect } from 'react';
import './TradeDetails.css';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useModal } from '@/contexts/ModalContext';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode, SortType } from '@/types/sort';

import WantedListDisplay from './WantedListDisplay';

import TradeTopRow from './TradeTopRow';
import TradeFiltersPanel from './TradeFiltersPanel';
import TradeOverlaysPanel from './TradeOverlaysPanel';

import useImageSelection from '../../utils/useImageSelection';
import { updateDisplayedList } from '../../utils/listUtils';

import {
  EXCLUDE_IMAGES_wanted,
  INCLUDE_IMAGES_wanted,
  FILTER_NAMES,
} from '../../utils/constants';

import useWantedFiltering from '../../hooks/useWantedFiltering';
import useToggleEditModeTrade from '../../hooks/useToggleEditModeTrade';

import {
  buildWantedOverlayPokemon,
  countVisibleWantedItems,
  initializeSelection,
  type SelectedPokemon,
} from './tradeDetailsHelpers';
import useTradeProposalFlow from './useTradeProposalFlow';
import { createScopedLogger } from '@/utils/logger';

type BooleanMap = Record<string, boolean>;
interface TradeDetailsListsState {
  wanted: Record<string, unknown>;
  [key: string]: unknown;
}

const normalizeWantedEntries = (
  value: unknown,
): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

const normalizeListsState = (
  value: Record<string, Record<string, unknown>>,
): TradeDetailsListsState => ({
  ...value,
  wanted: normalizeWantedEntries(value.wanted),
});

interface TradeDetailsProps {
  pokemon: PokemonVariant & {
    instanceData: Partial<PokemonInstance> & {
      not_wanted_list?: BooleanMap;
      wanted_filters?: BooleanMap;
      mirror?: boolean;
    };
  };
  lists: Record<string, Record<string, unknown>>;
  instances: Instances;
  sortType: SortType;
  sortMode: SortMode;
  openWantedOverlay: (pokemon: Record<string, unknown>) => void;
  variants: PokemonVariant[];
  isEditable: boolean;
  username: string;
  onClose?: () => void;
}

const log = createScopedLogger('TradeDetails');

const TradeDetails: React.FC<TradeDetailsProps> = ({
  pokemon,
  lists,
  instances,
  sortType,
  sortMode,
  openWantedOverlay,
  variants,
  isEditable,
  username,
}) => {
  const instancesMap = (instances ?? {}) as Record<string, PokemonInstance>;
  const { alert } = useModal();
  const { not_wanted_list = {}, wanted_filters = {} } = pokemon.instanceData;
  const [localNotWantedList, setLocalNotWantedList] = useState({
    ...not_wanted_list,
  });
  const [localWantedFilters, setLocalWantedFilters] = useState({
    ...wanted_filters,
  });
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const [isMirror, setIsMirror] = useState(pokemon.instanceData.mirror);
  const [mirrorKey, setMirrorKey] = useState<string | null>(null);
  const [listsState, setListsState] = useState<TradeDetailsListsState>(
    () => normalizeListsState(lists),
  );
  const [, setPendingUpdates] = useState<Record<string, boolean>>({});
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );

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
  const [selectedPokemon, setSelectedPokemon] = useState<SelectedPokemon | null>(null);

  const closeOverlay = () => {
    setIsOverlayOpen(false);
  };

  const {
    myInstances,
    isTradeProposalOpen,
    tradeClickedPokemon,
    isUpdateForTradeModalOpen,
    caughtInstancesToTrade,
    currentBaseKey,
    proposeTrade,
    closeTradeProposal,
    closeTradeSelectionModal,
  } = useTradeProposalFlow({
    selectedPokemon,
    closeOverlay,
    alert,
  });

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

  const wantedFilteringInput =
    listsState as unknown as Parameters<typeof useWantedFiltering>[0];

  const { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters } =
    useWantedFiltering(
      wantedFilteringInput,
      selectedExcludeImages,
      selectedIncludeOnlyImages,
      localWantedFilters,
      setLocalNotWantedList,
      localNotWantedList,
      false,
    );

  useEffect(() => {
    setLocalWantedFilters(updatedLocalWantedFilters);
  }, [updatedLocalWantedFilters]);

  useEffect(() => {
    setLocalNotWantedList({ ...(pokemon.instanceData.not_wanted_list ?? {}) });
  }, [pokemon.instanceData.not_wanted_list]);

  const { editMode, toggleEditMode } = useToggleEditModeTrade(
    pokemon,
    isMirror,
    mirrorKey,
    setMirrorKey,
    setIsMirror,
    normalizeListsState(lists),
    listsState,
    (updater) => setListsState((prev) => updater(prev)),
    localNotWantedList,
    setLocalNotWantedList,
    localWantedFilters,
    updateDetails,
    filteredOutPokemon
  );

  const toggleReciprocalUpdates = (key: string, updatedNotTrade: boolean) => {
    setPendingUpdates((prev) => ({ ...prev, [key]: updatedNotTrade }));
  };

  // Calculate the number of items in filteredWantedList excluding those in not_wanted_list.
  const filteredWantedListCount = countVisibleWantedItems(
    filteredWantedList,
    localNotWantedList,
  );

  const handleViewWantedList = () => {
    if (selectedPokemon) {
      // If user chooses "View Wanted List" from the overlay, just do what you normally do:
      handlePokemonClick(String(selectedPokemon.key ?? '')); 
      closeOverlay();
    }
  };

  const handleProposeTrade = async () => {
    await proposeTrade();
  };

  // When not in edit mode, clicking a Pokémon's thumbnail
  // will open the PokemonActionOverlay
  const handlePokemonClickModified = (
    instanceId: string,
    pokemonData: SelectedPokemon,
  ) => {
    if (!pokemonData) return;
    if (isEditable) {
      // If we can edit, do the default logic
      handlePokemonClick(instanceId);
    } else {
      // Otherwise, open the overlay
      setSelectedPokemon(pokemonData);
      setIsOverlayOpen(true);
    }
  };

  const handlePokemonClick = (instanceId: string) => {
    const merged = buildWantedOverlayPokemon(instanceId, variants, instancesMap);
    if (!merged.ok) {
      if (merged.error === 'variantNotFound') {
        log.error(`Variant not found for instance id: ${instanceId}`);
      } else {
        log.error(`No instance data found for key: ${instanceId}`);
      }
      return;
    }

    openWantedOverlay(merged.pokemon as unknown as Record<string, unknown>);
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

  const handleMirrorDisplayedListUpdate = (newData: Record<string, PokemonInstance>) => {
    updateDisplayedList(
      newData,
      localNotWantedList,
      (updater) => setListsState((prev) => updater(prev)),
    );
  };

  return (
    <div>
      <div className="trade-details-container">
        <TradeTopRow
          isMirror={isMirror}
          isEditable={isEditable}
          editMode={editMode}
          shouldShowFewLayout={shouldShowFewLayout}
          toggleEditMode={toggleEditMode}
          onResetFilters={handleResetFilters}
          pokemon={pokemon}
          instancesMap={instancesMap}
          lists={lists}
          setIsMirror={setIsMirror}
          setMirrorKey={setMirrorKey}
          updateMirrorDisplayedList={handleMirrorDisplayedListUpdate}
          updateDetails={updateDetails}
        />

        <TradeFiltersPanel
          isMirror={isMirror}
          shouldShowFewLayout={shouldShowFewLayout}
          editMode={editMode}
          selectedExcludeImages={selectedExcludeImages}
          selectedIncludeOnlyImages={selectedIncludeOnlyImages}
          toggleExcludeImageSelection={toggleExcludeImageSelection}
          toggleIncludeOnlyImageSelection={toggleIncludeOnlyImageSelection}
        />

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
              const pokemonData = filteredWantedList[key] as SelectedPokemon | undefined;
              if (!pokemonData) return;
              handlePokemonClickModified(key, pokemonData);
            }}
          />
        </div>
      </div>

      <TradeOverlaysPanel
        isOverlayOpen={isOverlayOpen}
        closeOverlay={closeOverlay}
        handleViewWantedList={handleViewWantedList}
        handleProposeTrade={handleProposeTrade}
        selectedPokemon={selectedPokemon}
        isTradeProposalOpen={isTradeProposalOpen}
        pokemon={pokemon}
        tradeClickedPokemon={tradeClickedPokemon}
        onCloseTradeProposal={closeTradeProposal}
        myInstances={myInstances}
        instancesMap={instancesMap}
        username={username}
        isUpdateForTradeModalOpen={isUpdateForTradeModalOpen}
        caughtInstancesToTrade={caughtInstancesToTrade}
        currentBaseKey={currentBaseKey}
        handleCancelTradeUpdate={closeTradeSelectionModal}
      />
    </div>
  );
};

export default TradeDetails;


