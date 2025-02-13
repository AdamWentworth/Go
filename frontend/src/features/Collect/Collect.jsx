// Collect.jsx
import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './Collect.css';

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

const PokemonListMemo = React.memo(PokemonList);
const HeaderUIMemo = React.memo(HeaderUI);
const SortOverlayMemo = React.memo(SortOverlay);

function Collect({ isOwnCollection }) {
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
  const [showAll, setShowAll] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [hasProcessedInstanceId, setHasProcessedInstanceId] = useState(false);
  const [highlightedCards, setHighlightedCards] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);

  // UI Controls
  const {
    showEvolutionaryLine,
    toggleEvolutionaryLine,
    isFastSelectEnabled,
    setIsFastSelectEnabled,
    isSelectAllEnabled,
    setIsSelectAllEnabled,
    sortType,
    setSortType,
    sortMode,
    toggleSortMode,
  } = useUIControls({
    showEvolutionaryLine: false,
    isFastSelectEnabled: false,
    isSelectAllEnabled: false,
    sortType: 'number',
    sortMode: 'ascending',
  });

  // Filter states
  const {
    isShiny,
    setIsShiny,
    showShadow,
    setShowShadow,
    selectedGeneration,
    setSelectedGeneration,
    searchTerm,
    setSearchTerm,
    showCostume,
    setShowCostume,
    generations,
    pokemonTypes,
  } = useSearchFilters(variants);

  // If viewing another user’s collection, load that data
  useUserDataLoader({
    isUsernamePath,
    username: urlUsername,
    location,
    setUserExists,
    setViewedOwnershipData,
    setOwnershipFilter,
    setShowAll,
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
      isShiny,
      searchTerm,
      showCostume,
      showShadow,
      multiFormPokedexNumbers,
      pokemonTypes,
      generations,
    }),
    [
      selectedGeneration,
      isShiny,
      searchTerm,
      showCostume,
      showShadow,
      pokemonTypes,
      generations,
    ]
  );

  const { filteredVariants, sortedPokemons } = usePokemonProcessing(
    variants,
    ownershipData,
    ownershipFilter,
    activeLists,
    filters,
    showEvolutionaryLine,
    showAll,
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

  const {
    toggleShiny,
    toggleCostume,
    toggleShadow,
    handleFastSelectToggle,
    toggleCardHighlight,
    selectAllToggle,
    toggleShowAll,
  } = useUIHandlers({
    setOwnershipFilter,
    setIsShiny,
    setShowCostume,
    setShowShadow,
    setIsFastSelectEnabled,
    setIsSelectAllEnabled,
    setHighlightedCards,
    setShowAll,
    highlightedCards,
    sortedPokemons,
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
    setIsSelectAllEnabled,
  });

  //--- Sliding view state ---
  const [activeView, setActiveView] = useState('pokemonList');

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

  const handleSelectList = (filter) => {
    setHighlightedCards(new Set());
    setOwnershipFilter(filter);

    if (
      filter === '' &&
      !isShiny &&
      !showCostume &&
      !showShadow
    ) {
      setShowAll(false);
    } else if (
      !showAll &&
      filter !== '' &&
      !isShiny &&
      !showCostume &&
      !showShadow
    ) {
      setShowAll(true);
    }
    setActiveView('pokemonList');
  };

  // Clear highlights if username changes
  useEffect(() => {
    if (isUsernamePath) {
      setHighlightedCards(new Set());
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

  return (
    <div className="collect-page">
      {isUsernamePath && userExists === false && <h1>User not found</h1>}

      {(loading || viewedLoading || isUpdating) && <LoadingSpinner />}

      {(isOwnCollection || userExists) && !loading && !viewedLoading && (
        <>
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
                  setIsShiny={setIsShiny}
                  setShowCostume={setShowCostume}
                  setShowShadow={setShowShadow}
                  setShowAll={setShowAll}
                  setActiveView={setActiveView}
                  pokedexLists={pokedexLists}
                  variants={variants}
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
                  isShiny={isShiny}
                  showShadow={showShadow}
                  multiFormPokedexNumbers={multiFormPokedexNumbers}
                  ownershipFilter={ownershipFilter}
                  lists={activeLists}
                  ownershipData={ownershipData}
                  showAll={showAll}
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
                  onSelectList={handleSelectList}
                  activeLists={activeLists}
                />
              </div>
            </div>
          </div>

          <SortOverlayMemo
            sortType={sortType}
            setSortType={setSortType}
            sortMode={sortMode}
            setSortMode={toggleSortMode}
          />
        </>
      )}

      {isEditable && highlightedCards.size > 0 && (
        <HighlightActionButton
          highlightedCards={highlightedCards}
          handleConfirmMoveToFilter={handleConfirmMoveToFilter}
          ownershipFilter={ownershipFilter}
          isUpdating={isUpdating}
        />
      )}

      <MegaPokemonModal />
      <FusionPokemonModal />
    </div>
  );
}

export default Collect;