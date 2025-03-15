// Collection.jsx
import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './Pokemon.css';

import PokemonList from './PokemonList';
import HeaderUI from './HeaderUI';
import SortOverlay from './SortOverlay';
import HighlightActionButton from './HighlightActionButton';
import PokedexFiltersMenu from './UIComponents/PokedexListsMenu';
import OwnershipListsMenu from './UIComponents/OwnershipListsMenu';

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

const PokemonListMemo = React.memo(PokemonList);
const HeaderUIMemo = React.memo(HeaderUI);
const SortOverlayMemo = React.memo(SortOverlay);

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
      // If viewing another user's collection, use all variants as the selected list.
      setSelectedPokedexList(variants);
      setDefaultListLoaded(true);
    } else if (pokedexLists?.default) {
      // Otherwise, use the default list from pokedexLists.
      setSelectedPokedexList(pokedexLists.default);
      setDefaultListLoaded(true);
    }
  }, [isUsernamePath, variants, pokedexLists]);  

  // Handler called when user clicks in PokedexListsMenu
  const handlePokedexMenuClick = (listData) => {
    setSelectedPokedexList(listData);
    setLastMenu('pokedex');
  };

  // Handler called when user clicks in OwnershipListsMenu
  const handleOwnershipListClick = (filter) => {
    setHighlightedCards(new Set());
    setOwnershipFilter(filter);
    setLastMenu('ownership');
    setActiveView('pokemonList');
  };

  // UI Controls
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

  // Filter states
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

  // If viewing another user’s collection, load that data
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

  // console.log(activeLists)
  // console.log(ownershipData)

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

  // Mega/Fusion
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

  //--- Sliding view state ---
  const [activeView, setActiveView] = useState('pokemonList');

  useEffect(() => {
    console.log('Active view changed to:', activeView);
  }, [activeView]);

  // 1) Create refs for all 3 panels
  const pokedexPanelRef = useRef(null);
  const mainListPanelRef = useRef(null);
  const ownershipPanelRef = useRef(null);

  // 2) When activeView changes, reset each panel’s scroll
  useEffect(() => {
    if (pokedexPanelRef.current) {
      pokedexPanelRef.current.scrollTop = 0;
    }
    if (mainListPanelRef.current) {
      mainListPanelRef.current.scrollTop = 0;
    }
    if (ownershipPanelRef.current) {
      ownershipPanelRef.current.scrollTop = 0;
    }
  }, [activeView]);

  // 3) “Swipe” logic
  const handleCardSwipe = (direction) => {
    if (direction === 'left') {
      if (activeView === 'pokedex') {
        setActiveView('pokemonList');
      } else if (activeView === 'pokemonList') {
        setActiveView('lists');
      }
    } else if (direction === 'right') {
      if (activeView === 'lists') {
        setActiveView('pokemonList');
      } else if (activeView === 'pokemonList') {
        setActiveView('pokedex');
      }
    }
  };

  const handleListsButtonClick = () => {
    setActiveView((prev) => (prev === 'lists' ? 'pokemonList' : 'lists'));
  };

  // Clear highlights if username changes
  useEffect(() => {
    if (isUsernamePath) {
      setHighlightedCards(new Set());
      setActiveView('pokemonList');
    }
  }, [isUsernamePath, urlUsername]);

  // Possibly replace path with canonical username
  useEffect(() => {
    if (!isOwnCollection && urlUsername) {
      const updateUsername = async () => {
        const canonical = urlUsername; // Extend logic if needed
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

  useEffect(() => {
    if (pokedexPanelRef.current) {
      pokedexPanelRef.current.scrollTop = 0;
    }
    if (mainListPanelRef.current) {
      mainListPanelRef.current.scrollTop = 0;
    }
    if (ownershipPanelRef.current) {
      ownershipPanelRef.current.scrollTop = 0;
    }
    // Reset page scroll to top when view changes
    window.scrollTo(0, 0);
  }, [activeView]);

  // Render LoadingSpinner until defaultListLoaded is true (in addition to other loading flags)
  if (loading || viewedLoading || isUpdating || !defaultListLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="collect-page">
      {isUsernamePath && userExists === false && <h1>User not found</h1>}

      <HeaderUIMemo
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showEvolutionaryLine={showEvolutionaryLine}
        toggleEvolutionaryLine={toggleEvolutionaryLine}
        onListsButtonClick={handleListsButtonClick}
        onPokedexClick={() =>
          setActiveView((prev) =>
            prev === 'pokedex' ? 'pokemonList' : 'pokedex'
          )
        }
        contextText={contextText}
        totalPokemon={sortedPokemons.length}
        highlightedCards={highlightedCards}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
      />

      {/* Horizontal slider container */}
      <div 
        className="view-slider-container" 
        style={{ 
          overflowY: activeView === 'pokemonList' ? 'auto' : 'hidden',
        }}
      >
        <div
          className="view-slider"
          style={{
            transform:
              activeView === 'pokedex'
                ? 'translateX(0)'
                : activeView === 'pokemonList'
                ? 'translateX(-100%)'
                : 'translateX(-200%)',
          }}
        >
          {/* LEFT panel - Pokedex */}
          <div
            className="slider-panel"
            ref={pokedexPanelRef}
          >
            <PokedexFiltersMenu
              setOwnershipFilter={setOwnershipFilter}
              setHighlightedCards={setHighlightedCards}
              setActiveView={setActiveView}
              onListSelect={handlePokedexMenuClick}
              pokedexLists={pokedexLists}
              variants={variants}
              onSwipe={handleCardSwipe}
            />
          </div>

          {/* MIDDLE panel - Main Pokemon List */}
          <div
            className="slider-panel"
            ref={mainListPanelRef}
          >
            <PokemonListMemo
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
              sortMode={sortMode}
              variants={variants}
              username={displayUsername}
              setIsFastSelectEnabled={setIsFastSelectEnabled}
              onSwipe={handleCardSwipe}
            />
          </div>

          {/* RIGHT panel - Ownership lists */}
          <div
            className="slider-panel"
            ref={ownershipPanelRef}
          >
            <OwnershipListsMenu
              onSelectList={handleOwnershipListClick}
              activeLists={activeLists}
              onSwipe={handleCardSwipe}
              variants={variants}
            />
          </div>
        </div>
      </div>

      {highlightedCards.size === 0 && (
        <SortOverlayMemo
          sortType={sortType}
          setSortType={setSortType}
          sortMode={sortMode}
          setSortMode={toggleSortMode}
        />
      )}

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
            {/* The close button to toggle off the overlay */}
            <CloseButton onClick={handleActionMenuToggle} />
            <div className="action-menu-content">
              <p>This is the action menu content.</p>
              {/* Add additional overlay UI elements here */}
            </div>
          </>
        )}
      </div>

      {/* Insert the reusable ActionMenu */}
      <ActionMenu />

      <MegaPokemonModal />
      <FusionPokemonModal />
    </div>
  );
}

export default Pokemon;
