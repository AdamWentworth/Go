import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Location, NavigateFunction } from 'react-router-dom';

import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { useUserSearchStore } from '@/stores/useUserSearchStore';
import { emptyTagBuckets } from '@/features/tags/utils/initializePokemonTags';
import { useModal } from '@/contexts/ModalContext';
import { useContextBackHandler } from '@/contexts/ContextBackContext';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { InstanceStatus, Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { SortMode, SortType } from '@/types/sort';
import type { SwipeHandlers } from './useSwipeHandler';
import type { PokemonOverlaySelection } from './useInstanceIdProcessor';
import type { MegaSelectionData } from '../features/mega/hooks/useMegaPokemonHandler';
import type { FusionSelectionData } from '@/types/fusion';

import useInstanceIdProcessor from './useInstanceIdProcessor';
import useUIControls from './useUIControls';
import useHandleChangeTags from '../services/changeInstanceTag/hooks/useHandleChangeTags';
import usePokemonProcessing from './usePokemonProcessing';
import useMegaPokemonHandler from '../features/mega/hooks/useMegaPokemonHandler';
import useFusionPokemonHandler from '../features/fusion/hooks/useFusionPokemonHandler';
import useSwipeHandler from './useSwipeHandler';
import { getNextActiveView } from '../utils/swipeNavigation';
import {
  buildSelectAllIds,
  buildSliderTransform,
  clampDragOffset,
  toInstanceStatus,
  type ActiveView,
  type LastMenu,
} from '../utils/pokemonPageHelpers';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('PokemonPage');
const SIDE_PANEL_TAG_FILTER_SYNC_DELAY_MS = 300;

type UsePokemonPageControllerArgs = {
  isOwnCollection: boolean;
  urlUsername?: string;
  location: Location;
  navigate: NavigateFunction;
};

type UsePokemonPageControllerResult = {
  isPageLoading: boolean;
  isUsernamePath: boolean;
  userExists: boolean | null;
  activeView: ActiveView;
  setActiveView: React.Dispatch<React.SetStateAction<ActiveView>>;
  handleListsButtonClick: () => void;
  handleClearTagFilter: () => void;
  contextText: React.ReactNode;
  sortedPokemons: PokemonVariant[];
  highlightedCards: Set<string>;
  handleClearSelection: () => void;
  handleSelectAll: () => void;
  lastMenu: LastMenu;
  tagFilter: string;
  sidePanelTagFilter: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  swipeHandlers: SwipeHandlers;
  transform: string;
  isDragging: boolean;
  setTagFilter: React.Dispatch<React.SetStateAction<string>>;
  variants: PokemonVariant[];
  isEditable: boolean;
  selectedPokemon: PokemonOverlaySelection;
  setSelectedPokemon: React.Dispatch<React.SetStateAction<PokemonOverlaySelection>>;
  isFastSelectEnabled: boolean;
  toggleCardHighlight: (pokemonId: string) => void;
  activeTags: TagBuckets;
  instances: Instances;
  sortType: SortType;
  setSortType: React.Dispatch<React.SetStateAction<SortType>>;
  sortMode: SortMode;
  setSortMode: React.Dispatch<React.SetStateAction<SortMode>>;
  displayUsername: string;
  setIsFastSelectEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  showEvolutionaryLine: boolean;
  toggleEvolutionaryLine: () => void;
  handleTagSelect: (filter: string) => void;
  handleConfirmChangeTags: (filter: InstanceStatus) => Promise<void>;
  activeStatusFilter: InstanceStatus | null;
  isUpdating: boolean;
  isMegaSelectionOpen: boolean;
  megaSelectionData: MegaSelectionData | null;
  handleMegaSelectionResolve: (selectedOption: string) => void;
  handleMegaSelectionReject: (error: unknown) => void;
  isFusionSelectionOpen: boolean;
  fusionSelectionData: FusionSelectionData | null;
  handleFusionSelectionResolve: (
    choice: string,
    leftInstanceId: string,
    rightInstanceId: string,
  ) => Promise<void>;
  closeFusionSelection: () => void;
  handleCreateNewLeft: () => Promise<void>;
  handleCreateNewRight: () => Promise<void>;
};

export default function usePokemonPageController({
  isOwnCollection,
  urlUsername,
  location,
  navigate,
}: UsePokemonPageControllerArgs): UsePokemonPageControllerResult {
  const isUsernamePath = !isOwnCollection && Boolean(urlUsername);

  const foreignInstances = useInstancesStore((s) => s.foreignInstances);
  const userExists = useUserSearchStore((s) => s.userExists);
  const viewedLoading = useUserSearchStore((s) => s.foreignInstancesLoading);
  const loadForeignProfile = useUserSearchStore((s) => s.loadForeignProfile);
  const canonicalUsername = useUserSearchStore((s) => s.canonicalUsername);

  const variants = useVariantsStore((s) => s.variants);
  const loading = useVariantsStore((s) => s.variantsLoading);
  const updateInstanceStatus = useInstancesStore((s) => s.updateInstanceStatus);
  const { alert } = useModal();
  const contextInstanceData = useInstancesStore((s) => s.instances);

  const tags = useTagsStore((s) => s.tags);
  const foreignTags = useTagsStore((s) => s.foreignTags);

  const instances = (isOwnCollection
    ? contextInstanceData
    : foreignInstances || contextInstanceData) as Instances;

  const [tagFilter, setTagFilter] = useState<string>('');
  const [sidePanelTagFilter, setSidePanelTagFilter] = useState<string>('');
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonOverlaySelection>(null);
  const [hasProcessedInstanceId, setHasProcessedInstanceId] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastMenu, setLastMenu] = useState<LastMenu>('ownership');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<ActiveView>('pokemon');
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isOverlayOpen = selectedPokemon !== null;
  const sidePanelTagFilterSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncSidePanelTagFilter = useCallback((nextFilter: string, delay: boolean) => {
    if (sidePanelTagFilterSyncRef.current) {
      clearTimeout(sidePanelTagFilterSyncRef.current);
      sidePanelTagFilterSyncRef.current = null;
    }

    if (!delay) {
      setSidePanelTagFilter(nextFilter);
      return;
    }

    sidePanelTagFilterSyncRef.current = setTimeout(() => {
      setSidePanelTagFilter(nextFilter);
      sidePanelTagFilterSyncRef.current = null;
    }, SIDE_PANEL_TAG_FILTER_SYNC_DELAY_MS);
  }, []);

  useEffect(
    () => () => {
      if (sidePanelTagFilterSyncRef.current) {
        clearTimeout(sidePanelTagFilterSyncRef.current);
      }
    },
    [],
  );

  const {
    showEvolutionaryLine,
    toggleEvolutionaryLine,
    isFastSelectEnabled,
    setIsFastSelectEnabled,
    sortType,
    setSortType,
    sortMode,
    setSortMode,
    highlightedCards,
    setHighlightedCards,
    toggleCardHighlight,
  } = useUIControls({
    showEvolutionaryLine: false,
    isFastSelectEnabled: false,
    sortType: 'number',
    sortMode: 'ascending',
  });

  useEffect(() => {
    if (!isUsernamePath) return;
    setHighlightedCards(new Set());
    setActiveView('pokemon');
  }, [isUsernamePath, urlUsername, setHighlightedCards]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    log.debug('Active view changed to:', activeView);
  }, [activeView]);

  useEffect(() => {
    if (!isUsernamePath || !urlUsername) return;
    void loadForeignProfile(urlUsername, () => {
      setTagFilter('Caught');
      syncSidePanelTagFilter('Caught', false);
    });
  }, [isUsernamePath, urlUsername, loadForeignProfile, syncSidePanelTagFilter]);

  const activeTags: TagBuckets = (
    isUsernamePath ? foreignTags ?? (emptyTagBuckets as TagBuckets) : tags
  ) as TagBuckets;

  const baseVariants = variants;
  const activeStatusFilter = toInstanceStatus(tagFilter);

  const { filteredVariants, sortedPokemons } = usePokemonProcessing(
    baseVariants,
    instances,
    tagFilter,
    activeTags,
    searchTerm,
    showEvolutionaryLine,
    sortType,
    sortMode,
  );

  useInstanceIdProcessor({
    variantsLoading: loading,
    filteredVariants,
    location: location as unknown as Parameters<typeof useInstanceIdProcessor>[0]['location'],
    selectedPokemon,
    isOwnCollection,
    hasProcessedInstanceId,
    navigate,
    setSelectedPokemon,
    setHasProcessedInstanceId,
  });

  const handleClearSelection = useCallback(() => {
    setIsFastSelectEnabled(false);
    setHighlightedCards(new Set());
  }, [setIsFastSelectEnabled, setHighlightedCards]);

  const handleSelectAll = useCallback(() => {
    setHighlightedCards(new Set(buildSelectAllIds(sortedPokemons)));
    setIsFastSelectEnabled(true);
  }, [sortedPokemons, setHighlightedCards, setIsFastSelectEnabled]);

  const handleListsButtonClick = useCallback(() => {
    setActiveView((prev) => (prev === 'tags' ? 'pokemon' : 'tags'));
  }, []);

  const handleClearTagFilter = useCallback(() => {
    const shouldDelaySidePanelUpdate = activeView !== 'pokemon';
    setHighlightedCards(new Set());
    setTagFilter('');
    setActiveView('pokemon');
    syncSidePanelTagFilter('', shouldDelaySidePanelUpdate);
  }, [activeView, setHighlightedCards, syncSidePanelTagFilter]);

  const handleTagSelect = useCallback(
    (filter: string) => {
      const shouldDelaySidePanelUpdate = activeView !== 'pokemon';
      setHighlightedCards(new Set());
      setTagFilter(filter);
      setLastMenu('ownership');
      setActiveView('pokemon');
      syncSidePanelTagFilter(filter, shouldDelaySidePanelUpdate);
    },
    [activeView, setHighlightedCards, syncSidePanelTagFilter],
  );

  const setStatusFilter = useCallback((filter: InstanceStatus) => {
    setTagFilter(filter);
    syncSidePanelTagFilter(filter, false);
  }, [syncSidePanelTagFilter]);

  const updateInstanceStatusBatch = useCallback(
    (keys: string[], filter: InstanceStatus) =>
      updateInstanceStatus(keys, filter, (message) => {
        void alert(message);
      }),
    [alert, updateInstanceStatus],
  );

  const {
    promptMegaPokemonSelection,
    isMegaSelectionOpen,
    megaSelectionData,
    handleMegaSelectionResolve,
    handleMegaSelectionReject,
  } = useMegaPokemonHandler();
  const {
    promptFusionPokemonSelection,
    isFusionSelectionOpen,
    fusionSelectionData,
    handleFusionSelectionResolve,
    closeFusionSelection,
    handleCreateNewLeft,
    handleCreateNewRight,
  } = useFusionPokemonHandler();

  const { handleConfirmChangeTags } = useHandleChangeTags({
    setTagFilter: setStatusFilter,
    setLastMenu,
    setHighlightedCards,
    highlightedCards,
    updateInstanceStatus: updateInstanceStatusBatch,
    variants,
    instances,
    setIsUpdating,
    promptMegaPokemonSelection,
    promptFusionPokemonSelection,
    setIsFastSelectEnabled,
  });

  const closeSelectedPokemon = useCallback(() => {
    setSelectedPokemon(null);
  }, []);

  const closeMegaSelectionFromBack = useCallback(() => {
    handleMegaSelectionReject('User canceled');
  }, [handleMegaSelectionReject]);

  const returnToPokemonView = useCallback(() => {
    setActiveView('pokemon');
  }, []);

  useContextBackHandler(activeView !== 'pokemon', returnToPokemonView, 'pokemon-view');
  useContextBackHandler(highlightedCards.size > 0, handleClearSelection, 'pokemon-selection');
  useContextBackHandler(selectedPokemon !== null, closeSelectedPokemon, 'pokemon-overlay');
  useContextBackHandler(isMegaSelectionOpen, closeMegaSelectionFromBack, 'mega-selection');
  useContextBackHandler(isFusionSelectionOpen, closeFusionSelection, 'fusion-selection');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const maxPeekDistance = 0.3;

  useEffect(() => {
    if (!isOverlayOpen) return;
    setDragOffset(0);
    setIsDragging(false);
  }, [isOverlayOpen]);

  const swipeHandlers = useSwipeHandler({
    disabled: isOverlayOpen,
    onSwipe: (dir) => {
      if (dir) setActiveView(getNextActiveView(activeView, dir));
      setDragOffset(0);
      setIsDragging(false);
    },
    onDrag: (dx) => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      setDragOffset(clampDragOffset(dx, width, maxPeekDistance));
      setIsDragging(true);
    },
  });

  const width =
    containerRef.current?.offsetWidth || (typeof window === 'undefined' ? 0 : window.innerWidth);
  const transform = buildSliderTransform(activeView, dragOffset, width);

  const displayUsername = canonicalUsername || urlUsername || '';
  const isEditable = isOwnCollection;
  const contextText: React.ReactNode =
    tagFilter === ''
      ? 'Catalog View'
      : isEditable
      ? 'Editing your Collection'
      : (
          <>
            Viewing <span className="username"><strong>{displayUsername}</strong></span>'s Collection
          </>
        );

  const isPageLoading = loading || viewedLoading || isUpdating;

  return {
    isPageLoading,
    isUsernamePath,
    userExists,
    activeView,
    setActiveView,
    handleListsButtonClick,
    handleClearTagFilter,
    contextText,
    sortedPokemons,
    highlightedCards,
    handleClearSelection,
    handleSelectAll,
    lastMenu,
    tagFilter,
    sidePanelTagFilter,
    containerRef,
    swipeHandlers,
    transform,
    isDragging,
    setTagFilter,
    variants,
    isEditable,
    selectedPokemon,
    setSelectedPokemon,
    isFastSelectEnabled,
    toggleCardHighlight,
    activeTags,
    instances,
    sortType,
    setSortType,
    sortMode,
    setSortMode,
    displayUsername,
    setIsFastSelectEnabled,
    searchTerm,
    setSearchTerm,
    showEvolutionaryLine,
    toggleEvolutionaryLine,
    handleTagSelect,
    handleConfirmChangeTags,
    activeStatusFilter,
    isUpdating,
    isMegaSelectionOpen,
    megaSelectionData,
    handleMegaSelectionResolve,
    handleMegaSelectionReject,
    isFusionSelectionOpen,
    fusionSelectionData,
    handleFusionSelectionResolve,
    closeFusionSelection,
    handleCreateNewLeft,
    handleCreateNewRight,
  };
}
