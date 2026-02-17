// TradeDetails.jsx
import React, { useState, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '@/components/EditSaveComponent';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useModal } from '@/contexts/ModalContext';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode, SortType } from '@/types/sort';

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

import PokemonActionOverlay from './PokemonActionOverlay';
import TradeProposal from './TradeProposal';

import { parseVariantId } from '@/utils/PokemonIDUtils';
import { getAllInstances } from '@/db/instancesDB';
import { getAllFromTradesDB } from '@/db/tradesDB';
import { shouldUpdateTradeInstances } from './shouldUpdateTradeInstances';
import {
  buildWantedOverlayPokemon,
  countVisibleWantedItems,
  initializeSelection,
  prepareTradeCandidateSets,
  resolveTradeProposalDecision,
  type SelectedPokemon,
} from './tradeDetailsHelpers';
import { createScopedLogger } from '@/utils/logger';

import UpdateForTradeModal from './UpdateForTradeModal';

type BooleanMap = Record<string, boolean>;
type GenericMap = Record<string, unknown>;

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
  const updateStatus = useInstancesStore((s) => s.updateInstanceStatus);
  const [isMirror, setIsMirror] = useState(pokemon.instanceData.mirror);
  const [mirrorKey, setMirrorKey] = useState<string | null>(null);
  const [listsState, setListsState] = useState(lists);
  const [, setPendingUpdates] = useState<Record<string, boolean>>({});
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  );

  // New state variables for UpdateForTradeModal
  const [isUpdateForTradeModalOpen, setIsUpdateForTradeModalOpen] = useState(false);
  const [caughtInstancesToTrade, setCaughtInstancesToTrade] = useState<PokemonInstance[]>([]);
  const [currentBaseKey, setCurrentBaseKey] = useState<string | null>(null); // New state for baseKey

  const [myInstances, setMyInstances] = useState<Instances | undefined>();

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

  // We will set these when user actually proposes the trade
  const [isTradeProposalOpen, setIsTradeProposalOpen] = useState(false);
  const [tradeClickedPokemon, setTradeClickedPokemon] = useState<Record<string, unknown> | null>(null);

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
      listsState as any,
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
    lists as any,
    listsState as any,
    setListsState as any,
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
    filteredWantedList as Record<string, unknown>,
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
    if (!selectedPokemon) {
      log.debug('No selectedPokemon. Aborting trade proposal.');
      return;
    }

    let userInstances: PokemonInstance[] = [];
    try {
      userInstances = await getAllInstances();
    } catch (error) {
      log.error('Failed to fetch user instances from IndexedDB:', error);
      alert('Could not fetch your instances. Aborting trade proposal.');
      return;
    }

    const {
      selectedBaseKey,
      hashedInstances,
      caughtInstances,
      tradeableInstances,
    } = prepareTradeCandidateSets(selectedPokemon, userInstances, parseVariantId);

    log.debug('Hashed ownership data prepared.', {
      count: Object.keys(hashedInstances).length,
    });
    log.debug('Caught instances after filter.', { count: caughtInstances.length });

    setMyInstances(hashedInstances);

    let decision: ReturnType<typeof resolveTradeProposalDecision>;
    if (tradeableInstances.length > 0) {
      try {
        const allTrades = await getAllFromTradesDB('pokemonTrades');
        decision = resolveTradeProposalDecision(
          selectedPokemon,
          selectedBaseKey,
          caughtInstances,
          tradeableInstances,
          allTrades,
        );
      } catch (error) {
        log.error('Failed to fetch or process trades data:', error);
        alert('Could not verify trade availability. Please try again.');
        return;
      }
    } else {
      decision = resolveTradeProposalDecision(
        selectedPokemon,
        selectedBaseKey,
        caughtInstances,
        tradeableInstances,
        [],
      );
    }

    switch (decision.kind) {
      case 'noCaught':
        alert('You do not have this Pokemon caught, so you cannot propose a trade.');
        return;
      case 'noAvailableTradeable':
        alert(
          'All instances of this Pokemon are currently involved in pending trades. Catch some more of this Pokemon to offer this trade or cancel your current pending trade.',
        );
        return;
      case 'needsTradeSelection':
        setCaughtInstancesToTrade(decision.caughtInstances);
        setCurrentBaseKey(decision.selectedBaseKey);
        setIsUpdateForTradeModalOpen(true);
        return;
      case 'proposalReady':
        setTradeClickedPokemon(decision.payload);
        closeOverlay();
        setIsTradeProposalOpen(true);
        return;
    }
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
  };

  const handleConfirmTradeUpdate = async (selectedInstanceIds: unknown) => {
    try {
      if (!shouldUpdateTradeInstances(selectedInstanceIds)) {
        setIsUpdateForTradeModalOpen(false);
        return;
      }

      // Use canonical store action so all tag/registration invariants stay consistent.
      const instanceIds = selectedInstanceIds.map((id) => String(id));
      await updateStatus(instanceIds, 'Trade');

      // Close the modal
      setIsUpdateForTradeModalOpen(false);

      // Proceed with the trade proposal
      // Re-run handleProposeTrade or implement the logic here
      handleProposeTrade(); // Be cautious to avoid infinite loops
    } catch (error) {
      log.error('Failed to update instances for trade:', error);
      alert("There was an error updating your instances for trade. Please try again.");
    }
  };

  const handleCancelTradeUpdate = () => {
    // Simply close the modal without making any changes
    setIsUpdateForTradeModalOpen(false);
  };

  // When not in edit mode, clicking a Pokémon's thumbnail
  // will open the PokemonActionOverlay
  const handlePokemonClickModified = (instanceId: string, pokemonData: SelectedPokemon) => {
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
                    onClick={editMode ? handleResetFilters : undefined}
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
                updateDisplayedList(newData, localNotWantedList, setListsState as any)
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
                  images={[...EXCLUDE_IMAGES_wanted]}
                  selectedImages={selectedExcludeImages}
                  toggleImageSelection={toggleExcludeImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.map((name) => TOOLTIP_TEXTS[name])}
                />
              </div>
              <div className="include-only-header-group image-group">
                <FilterImages
                  images={[...INCLUDE_IMAGES_wanted]}
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
                  images={[...EXCLUDE_IMAGES_wanted]}
                  selectedImages={selectedExcludeImages}
                  toggleImageSelection={toggleExcludeImageSelection}
                  editMode={editMode}
                  tooltipTexts={FILTER_NAMES.map((name) => TOOLTIP_TEXTS[name])}
                />
              </div>
              <div className="include-only-header-group include-few">
                <h3>Include</h3>
                <FilterImages
                  images={[...INCLUDE_IMAGES_wanted]}
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
              const pokemonData = (filteredWantedList as Record<string, SelectedPokemon>)[key];
              handlePokemonClickModified(key, pokemonData);
            }}
          />
        </div>
      </div>

      {/* The overlay that appears when not in edit mode */}
      <PokemonActionOverlay
        isOpen={isOverlayOpen}
        onClose={closeOverlay}
        onViewWantedList={handleViewWantedList}
        onProposeTrade={handleProposeTrade}
        pokemon={selectedPokemon as any}
      />

      {/* If the user actually proposes a trade, open TradeProposal */}
      {isTradeProposalOpen && (
        <TradeProposal
          passedInPokemon={pokemon}      // The "parent" Pokémon from which we came
          clickedPokemon={tradeClickedPokemon as any} // The user’s matches from their DB
          wantedPokemon={selectedPokemon as any} // <--- We pass the *clicked* Pokémon as wantedPokemon
          onClose={() => {
            setIsTradeProposalOpen(false);
            setTradeClickedPokemon(null);
          }}
          myInstances={(myInstances ?? {}) as any}
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
        />
      )}
    </div>
  );
};

export default TradeDetails;


