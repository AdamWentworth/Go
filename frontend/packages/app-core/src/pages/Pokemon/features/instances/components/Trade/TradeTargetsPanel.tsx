import React, { useState, useEffect } from 'react';
import './TradeTargetsPanel.css';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useModal } from '@/contexts/ModalContext';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode, SortType } from '@/types/sort';

import TradeTargetsList from './TradeTargetsList';

import TradeTargetsHeader from './TradeTargetsHeader';
import TradeFilterDropdowns from './TradeFilterDropdowns';
import TradeOverlaysPanel from './TradeOverlaysPanel';
import {
  TradeTargetsIntro,
  TradeTargetsWantedPanel,
} from './TradeTargetsPanelSections';

import useImageSelection from '../../utils/useImageSelection';
import { updateDisplayedList } from '../../utils/listUtils';

import {
  EXCLUDE_IMAGES_wanted,
  INCLUDE_IMAGES_wanted,
  FILTER_NAMES,
} from '../../utils/constants';

import useTradeTargetFiltering from '../../hooks/useTradeTargetFiltering';
import useToggleEditModeTrade from '../../hooks/useToggleEditModeTrade';

import {
  buildWantedOverlayPokemon,
  countVisibleWantedItems,
  initializeSelection,
  type SelectedPokemon,
} from './tradeTargetsHelpers';
import useTradeProposalFlow from './useTradeProposalFlow';
import { createScopedLogger } from '@/utils/logger';
import { useViewportBelow, VIEWPORT_BREAKPOINTS } from '@/hooks/useViewport';
import {
  normalizeListsState,
  type TradeTargetsPanelListsState,
} from './tradeTargetsPanelState';

type BooleanMap = Record<string, boolean>;

interface TradeTargetsPanelProps {
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
  openTradeTargetOverlay: (pokemon: Record<string, unknown>) => void;
  variants: PokemonVariant[];
  isEditable: boolean;
  username: string;
  onClose?: () => void;
  swipeCaptureHandlers?: React.HTMLAttributes<HTMLDivElement>;
}

const log = createScopedLogger('TradeTargetsPanel');

const TradeTargetsPanel: React.FC<TradeTargetsPanelProps> = ({
  pokemon,
  lists,
  instances,
  sortType,
  sortMode,
  openTradeTargetOverlay,
  variants,
  isEditable,
  username,
  swipeCaptureHandlers,
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
  const [listsState, setListsState] = useState<TradeTargetsPanelListsState>(
    () => normalizeListsState(lists),
  );
  const [, setPendingUpdates] = useState<Record<string, boolean>>({});
  const isSmallScreen = useViewportBelow(VIEWPORT_BREAKPOINTS.desktop);

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

  const tradeTargetFilteringInput =
    listsState as unknown as Parameters<typeof useTradeTargetFiltering>[0];

  const { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters } =
    useTradeTargetFiltering(
      tradeTargetFilteringInput,
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

  const filteredWantedListCount = countVisibleWantedItems(
    filteredWantedList,
    localNotWantedList,
    {
      editMode,
      isMirror,
      mirrorKey,
    },
  );

  const handleViewTargetList = () => {
    if (selectedPokemon) {
      handlePokemonClick(String(selectedPokemon.key ?? ''));
      closeOverlay();
    }
  };

  const handleProposeTrade = async () => {
    await proposeTrade();
  };

  const handlePokemonClickModified = (
    instanceId: string,
    pokemonData: SelectedPokemon,
  ) => {
    if (!pokemonData) return;
    if (isEditable) {
      handlePokemonClick(instanceId);
    } else {
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

    openTradeTargetOverlay(merged.pokemon as unknown as Record<string, unknown>);
  };

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
    <div className="trade-details-root" {...swipeCaptureHandlers}>
      <div className="trade-details-container">
        <TradeTargetsIntro isMirror={isMirror} />

        <div className="trade-details-container__filters-panel">
          <TradeTargetsHeader
            isMirror={isMirror}
            isEditable={isEditable}
            editMode={editMode}
            shouldShowFewLayout={shouldShowFewLayout}
            filtersSlot={
              <TradeFilterDropdowns
                isMirror={isMirror}
                editMode={editMode}
                selectedExcludeImages={selectedExcludeImages}
                selectedIncludeOnlyImages={selectedIncludeOnlyImages}
                toggleExcludeImageSelection={toggleExcludeImageSelection}
                toggleIncludeOnlyImageSelection={toggleIncludeOnlyImageSelection}
              />
            }
            toggleEditMode={toggleEditMode}
            pokemon={pokemon}
            instancesMap={instancesMap}
            lists={lists}
            setIsMirror={setIsMirror}
            setMirrorKey={setMirrorKey}
            updateMirrorDisplayedList={handleMirrorDisplayedListUpdate}
            updateDetails={updateDetails}
          />
        </div>

        <TradeTargetsWantedPanel
          isMirror={isMirror}
          isEditable={isEditable}
          editMode={editMode}
          visibleCount={filteredWantedListCount}
          onResetFilters={handleResetFilters}
        >
          <TradeTargetsList
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
              const pokemonData = filteredWantedList[key] as SelectedPokemon | undefined;
              if (!pokemonData) return;
              handlePokemonClickModified(key, pokemonData);
            }}
          />
        </TradeTargetsWantedPanel>
      </div>

      <TradeOverlaysPanel
        isOverlayOpen={isOverlayOpen}
        closeOverlay={closeOverlay}
        handleViewTargetList={handleViewTargetList}
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

export default TradeTargetsPanel;
