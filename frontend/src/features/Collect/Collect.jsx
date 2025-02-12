// Collect.jsx
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './Collect.css';

// Components for Collect
import PokemonList from './PokemonList';
import HeaderUI from './HeaderUI';
import SortOverlay from './SortOverlay';
import HighlightActionButton from './HighlightActionButton';
import PokedexFiltersMenu from './UIComponents/PokedexFiltersMenu';
import OwnershipListsMenu from './UIComponents/OwnershipListsMenu';

// Contexts
import { usePokemonData } from '../../contexts/PokemonDataContext';
import UserSearchContext from '../../contexts/UserSearchContext';
import { initializePokemonLists } from '../../contexts/PokemonData/PokemonTradeListOperations';

// Utils
import { multiFormPokedexNumbers } from '../../utils/constants';

// Hooks
import useUserDataLoader from './hooks/useUserDataLoader';
import useInstanceIdProcessor from './hooks/useInstanceIdProcessor';
import useResponsiveUI from './hooks/useResponsiveUI';
import useSearchFilters from '../../hooks/search/useSearchFilters';
import { useUIControls } from './hooks/useUIControls';
import useUIHandlers from './hooks/useUIHandlers';
import useHandleMoveToFilter from './hooks/useHandleMoveToFilter';
import usePokemonProcessing from './hooks/usePokemonProcessing';
import useMegaPokemonHandler from './hooks/useMegaPokemonHandler'; 
import useFusionPokemonHandler from './hooks/useFusionPokemonHandler';

// Global Component
import LoadingSpinner from '../../components/LoadingSpinner';

const PokemonListMemo = React.memo(PokemonList);
const HeaderUIMemo = React.memo(HeaderUI);
const SortOverlayMemo = React.memo(SortOverlay);

function Collect({ isOwnCollection }) {
  const { username: urlUsername } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isUsernamePath = !isOwnCollection && Boolean(urlUsername);

  // When username changes clear any highlighted cards
  useEffect(() => {
    if (isUsernamePath) {
      setHighlightedCards(new Set());
    }
  }, [isUsernamePath, urlUsername]);

  // Update URL to canonical username if needed
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

  const {
    viewedOwnershipData,
    userExists,
    viewedLoading,
    fetchUserOwnershipData,
    setUserExists,
    setViewedOwnershipData,
    canonicalUsername,
  } = useContext(UserSearchContext);

  const displayUsername = canonicalUsername || urlUsername;

  const {
    variants,
    ownershipData: contextOwnershipData,
    lists: defaultLists,
    loading,
    updateOwnership,
  } = usePokemonData();

  const ownershipData = isOwnCollection
    ? contextOwnershipData
    : viewedOwnershipData || contextOwnershipData;

  const [ownershipFilter, setOwnershipFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const isEditable = isOwnCollection;
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [hasProcessedInstanceId, setHasProcessedInstanceId] = useState(false);
  const [highlightedCards, setHighlightedCards] = useState(new Set());

  // Removed showFilterUI and showCollectUI from UI controls.
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

  // Load user data if viewing another user's collection
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
      multiFormPokedexNumbers,
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
    handleUpdateOwnershipFilter,
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
    setIsSelectAllEnabled,
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Mega and Fusion Pokémon handlers
  const { promptMegaPokemonSelection, MegaPokemonModal } = useMegaPokemonHandler();
  const { promptFusionPokemonSelection, FusionPokemonModal } = useFusionPokemonHandler();

  const { handleConfirmMoveToFilter } = useHandleMoveToFilter({
    setOwnershipFilter,
    setHighlightedCards,
    highlightedCards,
    updateOwnership,
    variants,
    ownershipData,
    setIsUpdating: (value) => setIsUpdating(value),
    promptMegaPokemonSelection,
    promptFusionPokemonSelection,
    setIsFastSelectEnabled,
    setIsSelectAllEnabled,
  });

  // --- Sliding view state ---
  // activeView can be:
  //   "pokedex" – left panel: PokedexFiltersMenu,
  //   "pokemonList" – middle panel: PokemonList,
  //   "lists" – right panel: OwnershipListsMenu.
  const [activeView, setActiveView] = useState("pokemonList");

  // Define a swipe handler that updates the active view.
  const handleCardSwipe = (direction) => {
    if (direction === 'left') {
      if (activeView === "pokedex") {
        setActiveView("pokemonList");
      } else if (activeView === "pokemonList") {
        setActiveView("lists");
      }
    } else if (direction === 'right') {
      if (activeView === "lists") {
        setActiveView("pokemonList");
      } else if (activeView === "pokemonList") {
        setActiveView("pokedex");
      }
    }
  };

  // Handler for switching to Lists view
  const handleListsButtonClick = () => {
    setActiveView(prev => (prev === "lists" ? "pokemonList" : "lists"));
  };

  // Handler for selecting a list from OwnershipListsMenu
  const handleSelectList = (filter) => {
    setHighlightedCards(new Set());
    setOwnershipFilter(filter);

    if (filter === '' && !isShiny && !showCostume && !showShadow) {
      setShowAll(false);
    } else if (!showAll && filter !== '' && !isShiny && !showCostume && !showShadow) {
      setShowAll(true);
    }
    // Return to the default Pokémon List view after selection
    setActiveView("pokemonList");
  };

  // Handler to clear the ownership filter and reset view
  const handleClearOwnershipFilter = () => {
    setOwnershipFilter('');
    if (!isShiny && !showCostume && !showShadow) {
      setShowAll(false);
    }
    setHighlightedCards(new Set());
    setActiveView("pokemonList");
  };

  const contextText =
    ownershipFilter === ''
      ? 'Pokédex View'
      : isEditable
      ? 'Editing your Collection'
      : (
        <>
          Viewing <span className="username"><strong>{displayUsername}</strong></span>'s Collection
        </>
      );

  return (
    <div>
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
              setActiveView((prev) => (prev === "pokedex" ? "pokemonList" : "pokedex"))
            }
            contextText={contextText}
            totalPokemon={sortedPokemons.length}
          />
          <div
            className="view-slider"
            style={{
              transform:
                activeView === "pokedex"
                  ? "translateX(0)"
                  : activeView === "pokemonList"
                  ? "translateX(-100%)"
                  : "translateX(-200%)",
            }}
          >
            <div className="slider-panel">
              <PokedexFiltersMenu 
                setOwnershipFilter={setOwnershipFilter}
                setHighlightedCards={setHighlightedCards}
                setIsShiny={setIsShiny}
                setShowCostume={setShowCostume}
                setShowShadow={setShowShadow}
                setShowAll={setShowAll}
                setActiveView={setActiveView}
              />
            </div>
            <div className="slider-panel">
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
            <div className="slider-panel">
              <OwnershipListsMenu 
                onSelectList={handleSelectList}
                activeLists={activeLists}
              />
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
