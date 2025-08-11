// Pokemon.jsx
// ============================
// 📦 Imports
// ============================

// 🔁 React & Routing
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

// 🎨 Styles
import './Pokemon.css';

// 🧩 UI Components
import HeaderUI from './components/Header/HeaderUI.jsx';
import PokemonMenu from './components/Menus/PokemonMenu/PokemonMenu.jsx';
import HighlightActionButton from './components/Menus/PokemonMenu/HighlightActionButton.jsx';
import PokedexFiltersMenu from './components/Menus/PokedexMenu/PokedexListsMenu.jsx';
import TagsMenu from './components/Menus/TagsMenu/TagsMenu.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ActionMenu from '../../components/ActionMenu.jsx';
import CloseButton from '../../components/CloseButton.jsx';

import FusionPokemonModal from './features/fusion/components/FusionPokemonModal';
import MegaPokemonModal from './features/mega/components/MegaPokemonModal';

// 🏪 Stores & Contexts
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { useUserSearchStore } from '@/stores/useUserSearchStore';
import { useModal } from '@/contexts/ModalContext';
import {
  emptyTagBuckets,
} from '@/features/tags/utils/initializePokemonTags';

// 🧠 Custom Hooks
import useInstanceIdProcessor from './hooks/useInstanceIdProcessor';
import useUIControls from './hooks/useUIControls';
import useHandleChangeTags from './services/changeInstanceTag/hooks/useHandleChangeTags';
import usePokemonProcessing from './hooks/usePokemonProcessing';
import useMegaPokemonHandler from './features/mega/hooks/useMegaPokemonHandler';
import useFusionPokemonHandler from './features/fusion/hooks/useFusionPokemonHandler';
import useSwipeHandler from './hooks/useSwipeHandler';

// 🧰 Utilities
import { getNextActiveView } from './utils/swipeNavigation';

// ============================
// 🧠 Component Memoization
// ============================

const PokemonMenuMemo = React.memo(PokemonMenu);
const HeaderUIMemo = React.memo(HeaderUI);

// ============================
// 🧩 Main Component
// ============================

function Pokemon({ isOwnCollection }) {

  // ----------------------------
  // 📍 Router & Context Setup
  // ----------------------------

  const { username: urlUsername } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isUsernamePath = !isOwnCollection && Boolean(urlUsername);

  const { alert } = useModal(); // ✅ safe: inside a component

  const foreignInstances       = useInstancesStore(s => s.foreignInstances);
  const userExists             = useUserSearchStore(s => s.userExists);
  const viewedLoading          = useUserSearchStore(s => s.foreignInstancesLoading);
  const loadForeignProfile     = useUserSearchStore(s => s.loadForeignProfile);
  const canonicalUsername      = useUserSearchStore(s => s.canonicalUsername);

  // ----------------------------
  // 🗃️ State Stores
  // ----------------------------

  const variants = useVariantsStore((s) => s.variants);
  const pokedexLists = useVariantsStore((s) => s.pokedexLists);
  const loading = useVariantsStore((s) => s.variantsLoading);
  const updateInstanceStatus = useInstancesStore((s) => s.updateInstanceStatus);
  const contextInstanceData = useInstancesStore((s) => s.instances);

  // Tags (system buckets) + computed children (Favorites, Caught▸Trade, Most Wanted)
  const tags = useTagsStore(s => s.tags);
  const systemChildren = useTagsStore(s => s.systemChildren);
  const foreignTags = useTagsStore(s => s.foreignTags);

  // DEV visibility: show both the big 4 and the computed children so you can verify cache/hydration
  // useEffect(() => {
  //   if (process.env.NODE_ENV !== 'development') return;
  //   const counts = Object.fromEntries(
  //     Object.entries(tags || {}).map(([k, v]) => [k, Object.keys(v || {}).length])
  //   );
  //   const childCounts = {
  //     favorites: Object.keys(systemChildren.caught?.favorite || {}).length,
  //     caughtTradeUnion: Object.keys(systemChildren.caught?.trade || {}).length,
  //     mostWanted: Object.keys(systemChildren.wanted?.mostWanted || {}).length,
  //   };
  //   console.log('[Pokemon] Tags buckets:', counts, tags);
  //   console.log('[Pokemon] System children (Favorites / Caught▸Trade / Most Wanted):', childCounts, systemChildren);
  // }, [tags, systemChildren]);

  const instances = isOwnCollection
    ? contextInstanceData
    : foreignInstances || contextInstanceData;

  // ----------------------------
  // 🧪 Component State
  // ----------------------------

  const [tagFilter, setTagFilter] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [hasProcessedInstanceId, setHasProcessedInstanceId] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPokedexList, setSelectedPokedexList] = useState([]);
  const [selectedPokedexKey, setSelectedPokedexKey]   = useState('all');
  const [lastMenu, setLastMenu] = useState('pokedex');
  const [defaultListLoaded, setDefaultListLoaded] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('pokemon');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);

  // ----------------------------
  // 📏 UI Controls Hook
  // ----------------------------

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

  // ----------------------------
  // 📦 Side Effects
  // ----------------------------

  useEffect(() => {
    if (isUsernamePath) {
      setSelectedPokedexList(variants);
      setSelectedPokedexKey('all');
      setDefaultListLoaded(true);
    } else if (variants) {
      setSelectedPokedexList(variants);
      setSelectedPokedexKey('all');
      setDefaultListLoaded(true);
    }
  }, [isUsernamePath, variants, pokedexLists]);

  useEffect(() => {
    if (isUsernamePath) {
      setHighlightedCards(new Set());
      setActiveView('pokemon');
    }
  }, [isUsernamePath, urlUsername]);

  useEffect(() => {
   if (process.env.NODE_ENV === 'development') {
      console.log('Active view changed to:', activeView);
    }
  }, [activeView]);

  // ----------------------------
  // 🔍 Data Loaders & Processing
  // ----------------------------

  // 🔍 Foreign-profile loader
  useEffect(() => {
    if (!isUsernamePath || !urlUsername) return;
    loadForeignProfile(urlUsername, () => setTagFilter('Caught')); // Caught (was Owned)
  }, [isUsernamePath, urlUsername, loadForeignProfile, setTagFilter]);

  const activeTags = isUsernamePath ? foreignTags ?? emptyTagBuckets : tags;

  const baseVariants = lastMenu === 'pokedex' ? selectedPokedexList : variants;

  const { filteredVariants, sortedPokemons } = usePokemonProcessing(
    baseVariants, instances, tagFilter, activeTags, searchTerm, showEvolutionaryLine, sortType, sortMode
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

  // ----------------------------
  // ✋ Event Handlers
  // ----------------------------

  const handlePokedexMenuClick = (listData) => {
    setSelectedPokedexList(listData);
    setLastMenu('pokedex');
  };

  const handleOwnershipListClick = (filter) => {
    setHighlightedCards(new Set());
    setTagFilter(filter);
    setLastMenu('ownership');
    setActiveView('pokemon');
  };

  const handleActionMenuToggle = () => {
    setShowActionMenu((prev) => !prev);
  };

  const handleClearSelection = () => {
    setIsFastSelectEnabled(false);
    setHighlightedCards(new Set());
  };

  const handleSelectAll = () => {
    const allIds = sortedPokemons.map(
      (p) => p.instanceData?.instance_id ?? p.variant_id
    );
    setHighlightedCards(new Set(allIds));
    setIsFastSelectEnabled(true);
  };

  const handleListsButtonClick = () => {
    setActiveView((prev) => (prev === 'tags' ? 'pokemon' : 'tags'));
  };

  // ----------------------------
  // 🧠 Handlers & Modals
  // ----------------------------

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
    handleFusionSelectionReject,
    closeFusionSelection,
    handleCreateNewLeft,
    handleCreateNewRight,
  } = useFusionPokemonHandler();  

  const { handleConfirmChangeTags } = useHandleChangeTags({
    setTagFilter,
    setLastMenu, // ensure header switches to TAGS sublabel
    setHighlightedCards,
    highlightedCards,
    updateInstanceStatus,
    variants,
    instances,
    setIsUpdating,
    promptMegaPokemonSelection,
    promptFusionPokemonSelection,
    setIsFastSelectEnabled
  });

  // ----------------------------
  // 🧭 Swipe Handler Logic
  // ----------------------------

  const containerRef     = useRef(null);
  const MAX_PEEK_DISTANCE = 0.3;

  const swipeHandlers = useSwipeHandler({
    onSwipe: (dir) => {
      if (dir) setActiveView(getNextActiveView(activeView, dir));
      setDragOffset(0);
      setIsDragging(false);
    },
    onDrag: (dx) => {
      if (!containerRef.current) return;
      const w   = containerRef.current.offsetWidth;
      const max = w * MAX_PEEK_DISTANCE;
      setDragOffset(Math.max(-max, Math.min(max, dx)));
      setIsDragging(true);
    },
  });

  const getTransform = () => {
    const idx     = ['pokedex', 'pokemon', 'tags'].indexOf(activeView);
    const basePct = -idx * 100;
    const offset  =
      (dragOffset / (containerRef.current?.offsetWidth || window.innerWidth)) *
      100;
    return `translate3d(${basePct + offset}%,0,0)`;
  };

  // ----------------------------
  // 🧱 Render Logic
  // ----------------------------

  const displayUsername = canonicalUsername || urlUsername;
  const isEditable = isOwnCollection;

  const contextText = tagFilter === ''
    ? 'Pokédex View'
    : isEditable
      ? 'Editing your Collection'
      : <>Viewing <span className="username"><strong>{displayUsername}</strong></span>'s Collection</>;

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
        /** Show POKÉDEX sublabel only when we’re in a pokedex-driven context and not on a foreign profile */
        pokedexSubLabel={
          !isUsernamePath && lastMenu === 'pokedex'
            ? `(${(selectedPokedexKey || 'all').toUpperCase()})`
            : undefined
        }
        /** Show TAGS sublabel when tags is the current context */
        tagsSubLabel={
          lastMenu === 'ownership' && tagFilter
            ? `(${String(tagFilter).toUpperCase()})`
            : undefined
        }
      />

      {/* Horizontal slider container */}
      <div
        className="view-slider-container"
        ref={containerRef}
        {...swipeHandlers}
        style={{
          overflow   : 'hidden',
          touchAction: 'pan-y',
          willChange : 'transform',
        }}
      >
        <div
          className="view-slider"
          style={{
            transform : getTransform(),
            transition: isDragging
              ? 'none'
              : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        >
          {/* LEFT – Pokédex panel */}
          <div className="slider-panel">
            <PokedexFiltersMenu
              setTagFilter        ={setTagFilter}
              setHighlightedCards ={setHighlightedCards}
              setActiveView       ={setActiveView}
              onListSelect        ={(list, key) => {
                setSelectedPokedexList(list);
                setSelectedPokedexKey(key || 'all');
                setLastMenu('pokedex');
              }}
              pokedexLists        ={pokedexLists}
              variants            ={variants}
            />
          </div>

          {/* MIDDLE – Pokémon list */}
          <div className="slider-panel">
            <PokemonMenuMemo
              isEditable             ={isEditable}
              sortedPokemons         ={sortedPokemons}
              allPokemons            ={variants}
              loading                ={loading}
              selectedPokemon        ={selectedPokemon}
              setSelectedPokemon     ={setSelectedPokemon}
              isFastSelectEnabled    ={isFastSelectEnabled}
              toggleCardHighlight    ={toggleCardHighlight}
              highlightedCards       ={highlightedCards}
              tagFilter              ={tagFilter}
              lists                  ={activeTags}
              instances              ={instances}
              sortType               ={sortType}
              setSortType            ={setSortType}
              sortMode               ={sortMode}
              setSortMode            ={setSortMode}
              variants               ={variants}
              username               ={displayUsername}
              setIsFastSelectEnabled ={setIsFastSelectEnabled}
              searchTerm             ={searchTerm}
              setSearchTerm          ={setSearchTerm}
              showEvolutionaryLine   ={showEvolutionaryLine}
              toggleEvolutionaryLine ={toggleEvolutionaryLine}
              onSearchMenuStateChange={(o) => setIsSearchMenuOpen(o)}
              activeView             ={activeView}
            />
          </div>

          {/* RIGHT – Tags */}
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
          tagFilter={tagFilter}
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
