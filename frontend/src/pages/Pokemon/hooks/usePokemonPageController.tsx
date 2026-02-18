import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Location, NavigateFunction } from 'react-router-dom';

import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { useUserSearchStore } from '@/stores/useUserSearchStore';
import { emptyTagBuckets } from '@/features/tags/utils/initializePokemonTags';
import { useModal } from '@/contexts/ModalContext';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { InstanceStatus, Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { SortMode, SortType } from '@/types/sort';
import type { SwipeHandlers } from './useSwipeHandler';
import type { PokemonOverlaySelection } from './useInstanceIdProcessor';
import type { PokedexLists } from '@/types/pokedex';
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
  isActiveView,
  toInstanceStatus,
  type ActiveView,
  type LastMenu,
} from '../utils/pokemonPageHelpers';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('PokemonPage');

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
  contextText: React.ReactNode;
  sortedPokemons: PokemonVariant[];
  highlightedCards: Set<string>;
  handleClearSelection: () => void;
  handleSelectAll: () => void;
  lastMenu: LastMenu;
  selectedPokedexKey: string;
  tagFilter: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  swipeHandlers: SwipeHandlers;
  transform: string;
  isDragging: boolean;
  setTagFilter: React.Dispatch<React.SetStateAction<string>>;
  handlePokedexHighlightedCardsChange: (cards: Set<number | string>) => void;
  handlePokedexActiveViewChange: (view: string) => void;
  handlePokedexListSelect: (list: PokemonVariant[], key: string) => void;
  pokedexLists: PokedexLists;
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
  showActionMenu: boolean;
  handleActionMenuToggle: () => void;
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
  const pokedexLists = useVariantsStore((s) => s.pokedexLists);
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
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonOverlaySelection>(null);
  const [hasProcessedInstanceId, setHasProcessedInstanceId] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedPokedexList, setSelectedPokedexList] = useState<PokemonVariant[]>([]);
  const [selectedPokedexKey, setSelectedPokedexKey] = useState<string>('all');
  const [lastMenu, setLastMenu] = useState<LastMenu>('pokedex');
  const [defaultListLoaded, setDefaultListLoaded] = useState<boolean>(false);
  const [showActionMenu, setShowActionMenu] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<ActiveView>('pokemon');
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

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
    setSelectedPokedexList(variants);
    setSelectedPokedexKey('all');
    setDefaultListLoaded(true);
  }, [isUsernamePath, variants, pokedexLists]);

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
    void loadForeignProfile(urlUsername, () => setTagFilter('Caught'));
  }, [isUsernamePath, urlUsername, loadForeignProfile]);

  const activeTags: TagBuckets = (
    isUsernamePath ? foreignTags ?? (emptyTagBuckets as TagBuckets) : tags
  ) as TagBuckets;

  const baseVariants = lastMenu === 'pokedex' ? selectedPokedexList : variants;
  const activeStatusFilter = toInstanceStatus(tagFilter);

  const { filteredVariants, sortedPokemons } = usePokemonProcessing(
    baseVariants,
    instances,
    activeStatusFilter,
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

  const handleActionMenuToggle = useCallback(() => {
    setShowActionMenu((prev) => !prev);
  }, []);

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

  const handlePokedexHighlightedCardsChange = useCallback(
    (cards: Set<number | string>) => {
      setHighlightedCards(new Set(Array.from(cards).map(String)));
    },
    [setHighlightedCards],
  );

  const handlePokedexActiveViewChange = useCallback((view: string) => {
    if (isActiveView(view)) {
      setActiveView(view);
    }
  }, []);

  const handlePokedexListSelect = useCallback((list: PokemonVariant[], key: string) => {
    setSelectedPokedexList(list);
    setSelectedPokedexKey(key || 'all');
    setLastMenu('pokedex');
  }, []);

  const handleTagSelect = useCallback(
    (filter: string) => {
      setHighlightedCards(new Set());
      setTagFilter(filter);
      setLastMenu('ownership');
      setActiveView('pokemon');
    },
    [setHighlightedCards],
  );

  const setStatusFilter = useCallback((filter: InstanceStatus) => {
    setTagFilter(filter);
  }, []);

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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const maxPeekDistance = 0.3;

  const swipeHandlers = useSwipeHandler({
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
      ? 'Pokedex View'
      : isEditable
      ? 'Editing your Collection'
      : (
          <>
            Viewing <span className="username"><strong>{displayUsername}</strong></span>'s Collection
          </>
        );

  const isPageLoading = loading || viewedLoading || isUpdating || !defaultListLoaded;

  return {
    isPageLoading,
    isUsernamePath,
    userExists,
    activeView,
    setActiveView,
    handleListsButtonClick,
    contextText,
    sortedPokemons,
    highlightedCards,
    handleClearSelection,
    handleSelectAll,
    lastMenu,
    selectedPokedexKey,
    tagFilter,
    containerRef,
    swipeHandlers,
    transform,
    isDragging,
    setTagFilter,
    handlePokedexHighlightedCardsChange,
    handlePokedexActiveViewChange,
    handlePokedexListSelect,
    pokedexLists,
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
    showActionMenu,
    handleActionMenuToggle,
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
