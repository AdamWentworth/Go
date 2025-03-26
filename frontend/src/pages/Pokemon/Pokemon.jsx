// Pokemon.jsx
import React, { useState, useMemo, useContext, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './Pokemon.css';

import HeaderUI from './HeaderUI';
import PokemonMenu from './PokemonMenu/PokemonMenu';
import HighlightActionButton from './PokemonMenu/HighlightActionButton';
import PokedexFiltersMenu from './PokedexMenu/PokedexListsMenu';
import TagsMenu from './TagsMenu/TagsMenu';

import { usePokemonData } from '../../contexts/PokemonDataContext';
import UserSearchContext from '../../contexts/UserSearchContext';
import { initializePokemonLists } from '../../contexts/PokemonData/PokemonTradeListOperations';

import { multiFormPokedexNumbers } from '../../utils/constants';

import useUserDataLoader from './hooks/useUserDataLoader';
import useInstanceIdProcessor from './hooks/useInstanceIdProcessor';
import useSearchFilters from '../../hooks/search/useSearchFilters';
import { useUIControls } from './hooks/useUIControls';
import useUIHandlers from './hooks/useUIHandlers';
import useHandleMoveToFilter from './hooks/useHandleMoveToFilter';
import usePokemonProcessing from './hooks/usePokemonProcessing';
import useMegaPokemonHandler from './hooks/useMegaPokemonHandler';
import useFusionPokemonHandler from './hooks/useFusionPokemonHandler';

import LoadingSpinner from '../../components/LoadingSpinner';
import ActionMenu from '../../components/ActionMenu';
import CloseButton from '../../components/CloseButton';

// Import the centralized swipe mapping function
import { getNextActiveView } from './utils/swipeNavigation';
import useSwipeHandler from './hooks/useSwipeHandler';

const PokemonMenuMemo = React.memo(PokemonMenu);
const HeaderUIMemo = React.memo(HeaderUI);

function Pokemon({ isOwnCollection }) {
  const { username: urlUsername } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isUsernamePath = !isOwnCollection && Boolean(urlUsername);

  const {
    viewedOwnershipData,
    userExists,
    viewedLoading,
    fetchUserOwnershipData,
    setUserExists,
    setViewedOwnershipData,
    canonicalUsername,
  } = useContext(UserSearchContext);

  const {
    variants,
    ownershipData: contextOwnershipData,
    lists: defaultLists,
    loading,
    pokedexLists,
    updateOwnership,
  } = usePokemonData();

  const ownershipData = isOwnCollection
    ? contextOwnershipData
    : viewedOwnershipData || contextOwnershipData;

  const [ownershipFilter, setOwnershipFilter] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [hasProcessedInstanceId, setHasProcessedInstanceId] = useState(false);
  const [highlightedCards, setHighlightedCards] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPokedexList, setSelectedPokedexList] = useState([]);
  // "pokedex" or "ownership"; default to "pokedex"
  const [lastMenu, setLastMenu] = useState('pokedex');

  // New state to indicate the default list has been loaded
  const [defaultListLoaded, setDefaultListLoaded] = useState(false);

  const [showActionMenu, setShowActionMenu] = useState(false);

  const handleActionMenuToggle = () => {
    setShowActionMenu((prev) => !prev);
  };

  const handleClearSelection = () => {
    setIsFastSelectEnabled(false);
    setHighlightedCards(new Set());
  };

  const handleSelectAll = () => {
    // Use pokemon.pokemonKey (not pokemon.id)
    const allIds = sortedPokemons.map((pokemon) => pokemon.pokemonKey);
    setHighlightedCards(new Set(allIds));
    setIsFastSelectEnabled(true);
  };

  useEffect(() => {
    if (isUsernamePath) {
      setSelectedPokedexList(variants);
      setDefaultListLoaded(true);
    } else if (pokedexLists?.default) {
      setSelectedPokedexList(pokedexLists.default);
      setDefaultListLoaded(true);
    }
  }, [isUsernamePath, variants, pokedexLists]);  

  const handlePokedexMenuClick = (listData) => {
    setSelectedPokedexList(listData);
    setLastMenu('pokedex');
  };

  const handleOwnershipListClick = (filter) => {
    setHighlightedCards(new Set());
    setOwnershipFilter(filter);
    setLastMenu('ownership');
    setActiveView('pokemon'); // updated from 'pokemonList'
  };

  const {
    showEvolutionaryLine,
    toggleEvolutionaryLine,
    isFastSelectEnabled,
    setIsFastSelectEnabled,
    sortType,
    setSortType,
    sortMode,
    toggleSortMode,
  } = useUIControls({
    showEvolutionaryLine: false,
    isFastSelectEnabled: false,
    sortType: 'number',
    sortMode: 'ascending',
  });

  const {
    selectedGeneration,
    setSelectedGeneration,
    searchTerm,
    setSearchTerm,
    generations,
    pokemonTypes,
    filteredPokemonList,
    isTypeSearch,
    isGenerationSearch,
  } = useSearchFilters(variants);

  useUserDataLoader({
    isUsernamePath,
    username: urlUsername,
    location,
    setUserExists,
    setViewedOwnershipData,
    setOwnershipFilter,
    fetchUserOwnershipData,
  });

  const activeLists = useMemo(() => {
    return isUsernamePath && viewedOwnershipData
      ? initializePokemonLists(viewedOwnershipData, variants, true)
      : defaultLists;
  }, [isUsernamePath, viewedOwnershipData, variants, defaultLists]);

  const filters = useMemo(
    () => ({
      selectedGeneration,
      searchTerm,
      multiFormPokedexNumbers,
      pokemonTypes,
      generations,
    }),
    [selectedGeneration, searchTerm, pokemonTypes, generations]
  );

  const baseVariants = lastMenu === 'pokedex' ? selectedPokedexList : variants;

  const { filteredVariants, sortedPokemons } = usePokemonProcessing(
    baseVariants,
    ownershipData,
    ownershipFilter,
    activeLists,
    filters,
    showEvolutionaryLine,
    sortType,
    sortMode
  );

  useInstanceIdProcessor({
    viewedOwnershipData,
    viewedLoading,
    filteredVariants,
    location,
    selectedPokemon,
    isOwnCollection,
    hasProcessedInstanceId,
    navigate,
    setSelectedPokemon,
    setHasProcessedInstanceId,
  });

  const { toggleCardHighlight } = useUIHandlers({
    setHighlightedCards,
    setIsFastSelectEnabled,
  });

  const { promptMegaPokemonSelection, MegaPokemonModal } = useMegaPokemonHandler();
  const { promptFusionPokemonSelection, FusionPokemonModal } = useFusionPokemonHandler();

  const { handleConfirmMoveToFilter } = useHandleMoveToFilter({
    setOwnershipFilter,
    setHighlightedCards,
    highlightedCards,
    updateOwnership,
    variants,
    ownershipData,
    setIsUpdating,
    promptMegaPokemonSelection,
    promptFusionPokemonSelection,
    setIsFastSelectEnabled,
  });

  // --- Sliding view state ---
  // Default view is now "pokemon" (the middle panel)
  const [activeView, setActiveView] = useState('pokemon');

  useEffect(() => {
    console.log('Active view changed to:', activeView);
  }, [activeView]);

  // Add these new state variables
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);

  // Update swipe handler initialization
  const swipeHandlers = useSwipeHandler({
    onSwipe: (direction) => {
      if (direction) {
        const nextView = getNextActiveView(activeView, direction);
        setActiveView(nextView);
      }
      // Animate back if swipe was canceled
      setDragOffset(0);
      setIsDragging(false);
    },
    onDrag: (dx) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const maxOffset = containerWidth * 0.3; // Max peek distance
      
      // Limit drag offset to max peek distance
      const limitedDx = Math.max(-maxOffset, Math.min(maxOffset, dx));
      setDragOffset(limitedDx);
      setIsDragging(true);
    }
  });

  const getTransform = () => {
    const viewIndex = ['pokedex', 'pokemon', 'tags'].indexOf(activeView);
    let baseTransform = -viewIndex * 100;
    
    // Add drag offset as percentage of container width
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const offsetPercentage = (dragOffset / containerWidth) * 100;
      baseTransform += offsetPercentage;
    }
    
    return `translateX(${baseTransform}%)`;
  };

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = swipeHandlers;

  const pokedexPanelRef = useRef(null);
  const mainListPanelRef = useRef(null);
  const ownershipPanelRef = useRef(null);

  useEffect(() => {
    if (pokedexPanelRef.current) pokedexPanelRef.current.scrollTop = 0;
    if (mainListPanelRef.current) mainListPanelRef.current.scrollTop = 0;
    if (ownershipPanelRef.current) ownershipPanelRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [activeView]);

  const handleListsButtonClick = () => {
    setActiveView((prev) => (prev === 'tags' ? 'pokemon' : 'tags'));
  };

  useEffect(() => {
    if (isUsernamePath) {
      setHighlightedCards(new Set());
      setActiveView('pokemon');
    }
  }, [isUsernamePath, urlUsername]);

  useEffect(() => {
    if (!isOwnCollection && urlUsername) {
      const updateUsername = async () => {
        const canonical = urlUsername;
        if (canonical && canonical !== urlUsername) {
          window.history.replaceState(
            {},
            '',
            location.pathname.replace(urlUsername, canonical)
          );
        }
      };
      updateUsername();
    }
  }, [urlUsername, isOwnCollection, location.pathname]);

  const displayUsername = canonicalUsername || urlUsername;
  const isEditable = isOwnCollection;

  const contextText =
    ownershipFilter === ''
      ? 'Pokédex View'
      : isEditable
      ? 'Editing your Collection'
      : (
        <>
          Viewing{' '}
          <span className="username">
            <strong>{displayUsername}</strong>
          </span>
          's Collection
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
        onPokemonClick={() => setActiveView('pokemon')}  // NEW handler for Pokémon click
        contextText={contextText}
        totalPokemon={sortedPokemons.length}
        highlightedCards={highlightedCards}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
      />

      {/* Horizontal slider container */}
      <div 
        className="view-slider-container"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          overflowY: activeView === 'pokemon' ? 'auto' : 'hidden',
          touchAction: 'pan-y'
        }}
      >
        <div
          className="view-slider"
          style={{
            transform: getTransform(),
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {/* LEFT panel - Pokedex */}
          <div className="slider-panel" ref={pokedexPanelRef}>
            <PokedexFiltersMenu
              setOwnershipFilter={setOwnershipFilter}
              setHighlightedCards={setHighlightedCards}
              setActiveView={setActiveView}
              onListSelect={handlePokedexMenuClick}
              pokedexLists={pokedexLists}
              variants={variants}
            />
          </div>

          {/* MIDDLE panel - Main Pokémon List */}
          <div className="slider-panel" ref={mainListPanelRef}>
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
              multiFormPokedexNumbers={multiFormPokedexNumbers}
              ownershipFilter={ownershipFilter}
              lists={activeLists}
              ownershipData={ownershipData}
              sortType={sortType}
              setSortType={setSortType}
              sortMode={sortMode}
              toggleSortMode={toggleSortMode}
              variants={variants}
              username={displayUsername}
              setIsFastSelectEnabled={setIsFastSelectEnabled}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              showEvolutionaryLine={showEvolutionaryLine}
              toggleEvolutionaryLine={toggleEvolutionaryLine}
              onSearchMenuStateChange={(open) => {
                console.log('[Pokemon] onSearchMenuStateChange ->', open);
                setIsSearchMenuOpen(open);
              }}
            />
          </div>

          {/* RIGHT panel - Tags */}
          <div className="slider-panel" ref={ownershipPanelRef}>
            <TagsMenu
              onSelectList={handleOwnershipListClick}
              activeLists={activeLists}
              variants={variants}
            />
          </div>
        </div>
      </div>

      {isEditable && highlightedCards.size > 0 && (
        <HighlightActionButton
          highlightedCards={highlightedCards}
          handleConfirmMoveToFilter={handleConfirmMoveToFilter}
          ownershipFilter={ownershipFilter}
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

      <MegaPokemonModal />
      <FusionPokemonModal />
    </div>
  );
}

export default Pokemon;