import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './Pokemon.css';

import HeaderUI from './components/Header/HeaderUI';
import PokemonMenu from './components/Menus/PokemonMenu/PokemonMenu';
import HighlightActionButton from './components/Menus/PokemonMenu/HighlightActionButton';
import PokedexFiltersMenu from './components/Menus/PokedexMenu/PokedexListsMenu';
import TagsMenu from './components/Menus/TagsMenu/TagsMenu';
import LoadingSpinner from '../../components/LoadingSpinner';
import ActionMenu from '../../components/ActionMenu';
import CloseButton from '../../components/CloseButton';

import FusionPokemonModal from './features/fusion/components/FusionPokemonModal';
import MegaPokemonModal from './features/mega/components/MegaPokemonModal';

import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { useUserSearchStore } from '@/stores/useUserSearchStore';
import { emptyTagBuckets } from '@/features/tags/utils/initializePokemonTags';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { InstanceStatus } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';

import useInstanceIdProcessor from './hooks/useInstanceIdProcessor';
import type { PokemonOverlaySelection } from './hooks/useInstanceIdProcessor';
import useUIControls from './hooks/useUIControls';
import useHandleChangeTags from './services/changeInstanceTag/hooks/useHandleChangeTags';
import usePokemonProcessing from './hooks/usePokemonProcessing';
import useMegaPokemonHandler from './features/mega/hooks/useMegaPokemonHandler';
import useFusionPokemonHandler from './features/fusion/hooks/useFusionPokemonHandler';
import useSwipeHandler from './hooks/useSwipeHandler';
import { getNextActiveView } from './utils/swipeNavigation';

type ActiveView = 'pokedex' | 'pokemon' | 'tags';
type LastMenu = 'pokedex' | 'ownership';

interface PokemonProps {
  isOwnCollection: boolean;
}

const PokemonMenuMemo = React.memo(PokemonMenu);
const HeaderUIMemo = React.memo(HeaderUI);

const isActiveView = (value: string): value is ActiveView =>
  value === 'pokedex' || value === 'pokemon' || value === 'tags';
const isInstanceStatus = (value: string): value is InstanceStatus =>
  value === 'Caught' || value === 'Trade' || value === 'Wanted' || value === 'Missing';

function Pokemon({ isOwnCollection }: PokemonProps) {
  const { username: urlUsername } = useParams<{ username: string }>();
  const location = useLocation();
  const navigate = useNavigate();
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
  const contextInstanceData = useInstancesStore((s) => s.instances);

  const tags = useTagsStore((s) => s.tags);
  const foreignTags = useTagsStore((s) => s.foreignTags);

  const instances = isOwnCollection
    ? contextInstanceData
    : foreignInstances || contextInstanceData;

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
    console.log('Active view changed to:', activeView);
  }, [activeView]);

  useEffect(() => {
    if (!isUsernamePath || !urlUsername) return;
    void loadForeignProfile(urlUsername, () => setTagFilter('Caught'));
  }, [isUsernamePath, urlUsername, loadForeignProfile]);

  const activeTags: TagBuckets = (
    isUsernamePath ? foreignTags ?? (emptyTagBuckets as unknown as TagBuckets) : tags
  ) as TagBuckets;

  const baseVariants = lastMenu === 'pokedex' ? selectedPokedexList : variants;
  const activeStatusFilter: InstanceStatus | null = isInstanceStatus(tagFilter) ? tagFilter : null;

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
    location,
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
    const allIds = sortedPokemons
      .map((p) => p.instanceData?.instance_id ?? p.variant_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    setHighlightedCards(new Set(allIds));
    setIsFastSelectEnabled(true);
  }, [sortedPokemons, setHighlightedCards, setIsFastSelectEnabled]);

  const handleListsButtonClick = useCallback(() => {
    setActiveView((prev) => (prev === 'tags' ? 'pokemon' : 'tags'));
  }, []);

  const setStatusFilter = useCallback((filter: InstanceStatus) => {
    setTagFilter(filter);
  }, []);

  const updateInstanceStatusBatch = useCallback(
    (keys: string[], filter: InstanceStatus) => updateInstanceStatus(keys, filter),
    [updateInstanceStatus],
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
      const max = width * maxPeekDistance;
      setDragOffset(Math.max(-max, Math.min(max, dx)));
      setIsDragging(true);
    },
  });

  const getTransform = () => {
    const idx = ['pokedex', 'pokemon', 'tags'].indexOf(activeView);
    const basePct = -idx * 100;
    const width = containerRef.current?.offsetWidth || window.innerWidth;
    const offsetPct = (dragOffset / width) * 100;
    return `translate3d(${basePct + offsetPct}%,0,0)`;
  };

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

  if (loading || viewedLoading || isUpdating || !defaultListLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="pokemon-page">
      {isUsernamePath && userExists === false && <h1>User not found</h1>}

      <HeaderUIMemo
        activeView={activeView}
        onListsButtonClick={handleListsButtonClick}
        onPokedexClick={() =>
          setActiveView((prev) => (prev === 'pokedex' ? 'pokemon' : 'pokedex'))
        }
        onPokemonClick={() => setActiveView('pokemon')}
        contextText={contextText}
        totalPokemon={sortedPokemons.length}
        highlightedCards={highlightedCards}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        pokedexSubLabel={
          !isUsernamePath && lastMenu === 'pokedex'
            ? `(${(selectedPokedexKey || 'all').toUpperCase()})`
            : undefined
        }
        tagsSubLabel={
          lastMenu === 'ownership' && tagFilter
            ? `(${String(tagFilter).toUpperCase()})`
            : undefined
        }
      />

      <div
        className="view-slider-container"
        ref={containerRef}
        {...swipeHandlers}
        style={{
          overflow: 'hidden',
          touchAction: 'pan-y',
          willChange: 'transform',
        }}
      >
        <div
          className="view-slider"
          style={{
            transform: getTransform(),
            transition: isDragging
              ? 'none'
              : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        >
          <div className="slider-panel">
            <PokedexFiltersMenu
              setTagFilter={setTagFilter}
              setHighlightedCards={(cards) =>
                setHighlightedCards(new Set(Array.from(cards).map(String)))
              }
              setActiveView={(view) => {
                if (isActiveView(view)) setActiveView(view);
              }}
              onListSelect={(list, key) => {
                setSelectedPokedexList(list);
                setSelectedPokedexKey(key || 'all');
                setLastMenu('pokedex');
              }}
              pokedexLists={pokedexLists}
              variants={variants}
            />
          </div>

          <div className="slider-panel">
            <PokemonMenuMemo
              isEditable={isEditable}
              sortedPokemons={sortedPokemons}
              allPokemons={variants}
              loading={loading}
              selectedPokemon={selectedPokemon}
              setSelectedPokemon={setSelectedPokemon}
              isFastSelectEnabled={isFastSelectEnabled}
              toggleCardHighlight={toggleCardHighlight}
              highlightedCards={highlightedCards}
              tagFilter={tagFilter}
              lists={activeTags}
              instances={instances}
              sortType={sortType}
              setSortType={setSortType}
              sortMode={sortMode}
              setSortMode={setSortMode}
              variants={variants}
              username={displayUsername}
              setIsFastSelectEnabled={setIsFastSelectEnabled}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              showEvolutionaryLine={showEvolutionaryLine}
              toggleEvolutionaryLine={toggleEvolutionaryLine}
              activeView={activeView}
            />
          </div>

          <div className="slider-panel">
            <TagsMenu
              onSelectTag={(filter) => {
                setHighlightedCards(new Set());
                setTagFilter(filter);
                setLastMenu('ownership');
                setActiveView('pokemon');
              }}
              activeTags={activeTags}
              variants={variants}
            />
          </div>
        </div>
      </div>

      {isEditable && highlightedCards.size > 0 && (
        <HighlightActionButton
          highlightedCards={highlightedCards}
          handleConfirmChangeTags={handleConfirmChangeTags}
          tagFilter={activeStatusFilter ?? ''}
          isUpdating={isUpdating}
        />
      )}

      <div className={`action-menu-overlay ${showActionMenu ? 'active' : ''}`}>
        {showActionMenu && (
          <>
            <CloseButton onClick={handleActionMenuToggle} />
            <div className="action-menu-content">
              <p>This is the action menu content.</p>
            </div>
          </>
        )}
      </div>
      <ActionMenu />

      <MegaPokemonModal
        open={isMegaSelectionOpen}
        data={megaSelectionData}
        onResolve={handleMegaSelectionResolve}
        onReject={handleMegaSelectionReject}
      />

      {isFusionSelectionOpen && fusionSelectionData && (
        <FusionPokemonModal
          isOpen={isFusionSelectionOpen}
          fusionSelectionData={fusionSelectionData}
          onConfirm={handleFusionSelectionResolve}
          onCancel={closeFusionSelection}
          onCreateNewLeft={handleCreateNewLeft}
          onCreateNewRight={handleCreateNewRight}
        />
      )}
    </div>
  );
}

export default Pokemon;
