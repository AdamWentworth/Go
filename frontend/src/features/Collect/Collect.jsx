// Collect.jsx

import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './Collect.css'

// Components for Collect
import PokemonList from './PokemonList';
import ListsMenu from './ListsMenu';
import HeaderUI from './HeaderUI';
import SortOverlay from './SortOverlay';
import HighlightActionButton from './HighlightActionButton';
import PokedexFiltersMenu from './UIComponents/PokedexFiltersMenu'; // New: for pokedex filters

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
import useFusionPokemonHandler from './hooks/useFusionPokemonHandler'

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

  useEffect(() => {
    if (!isOwnCollection && urlUsername) {
      const updateUsername = async () => {
        const canonical = urlUsername;
        if (canonical && canonical !== urlUsername) {
          // Update URL to canonical username
          window.history.replaceState(
            {},
            '',
            location.pathname.replace(urlUsername, canonical)
          );
        }
      };
      updateUsername();
    }
  }, [urlUsername, isOwnCollection]);

  useEffect(() => {
    if (isUsernamePath) {
      setHighlightedCards(new Set());
    }
  }, [isUsernamePath, urlUsername]);

  const {
    viewedOwnershipData,
    userExists,
    viewedLoading,
    fetchUserOwnershipData,
    setUserExists,
    setViewedOwnershipData,
    canonicalUsername
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

  const [filterVersion, setFilterVersion] = useState(0);

  const {
    showFilterUI,
    setShowFilterUI,
    showCollectUI,
    setShowCollectUI,
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
    showFilterUI: false,
    showCollectUI: false,
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

  // Use custom hook to handle responsive UI
  const isWide = useResponsiveUI(setShowFilterUI, setShowCollectUI);

  // Use custom hook to load user data
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
      filterVersion, // Include this so that any change in filterVersion forces a re-creation.
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
      filterVersion,
    ]
  );  
  
  const handleSelectPokedexFilter = (filter) => {
    // Clear highlighted cards and set the ownership filter if needed.
    setHighlightedCards(new Set());
  
    // Reset filter states based on the option selected.
    switch (filter) {
      case 'Default':
        setIsShiny(false);
        setShowCostume(false);
        setShowShadow(false);
        setShowAll(false);
        break;
      case 'Shiny':
        setIsShiny(true);
        setShowCostume(false);
        setShowShadow(false);
        setShowAll(false);
        break;
      case 'Costume':
        setIsShiny(false);
        setShowCostume(true);
        setShowShadow(false);
        setShowAll(false);
        break;
      case 'Shadow':
        setIsShiny(false);
        setShowCostume(false);
        setShowShadow(true);
        setShowAll(false);
        break;
      default:
        // In case of any unexpected value, reset to no special filter.
        setIsShiny(false);
        setShowCostume(false);
        setShowShadow(false);
        setShowAll(false);
        break;
    }
  
    // Increment filterVersion to force usePokemonProcessing to re-run.
    setFilterVersion((prev) => prev + 1);
  
    // Slide back to the Pokémon list view.
    setActiveView("pokemonList");
  };  

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

  // Use custom hook to process instanceId
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

  // Initialize the Mega Pokémon handler
  const {
    promptMegaPokemonSelection,
    MegaPokemonModal,
  } = useMegaPokemonHandler();

  const {
    promptFusionPokemonSelection,
    FusionPokemonModal,
  } = useFusionPokemonHandler();

  const {
    handleConfirmMoveToFilter,
  } = useHandleMoveToFilter({
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

  // Replace isShowingLists with activeView.
  // Possible values: "pokemonList" (default), "lists", "pokedex"
  const [activeView, setActiveView] = useState("pokemonList");

  // Handler for "Lists" button click (existing behavior)
  const handleListsButtonClick = () => {
    setActiveView("lists");
  };

  // Handler for selecting a list from ListsMenu
  const handleSelectList = (filter) => {
    setHighlightedCards(new Set());
    setOwnershipFilter(filter);

    if (filter === '' && !isShiny && !showCostume && !showShadow) {
      setShowAll(false);
    } else if (!showAll && filter !== '' && !isShiny && !showCostume && !showShadow) {
      setShowAll(true);
    }

    // Return to default view after selection
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
            isEditable={isEditable}
            username={displayUsername}
            showFilterUI={showFilterUI}
            toggleFilterUI={() => setShowFilterUI((prev) => !prev)}
            isShiny={isShiny}
            toggleShiny={toggleShiny}
            showCostume={showCostume}
            toggleCostume={toggleCostume}
            showShadow={showShadow}
            toggleShadow={toggleShadow}
            toggleShowAll={toggleShowAll}
            showAll={showAll}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showEvolutionaryLine={showEvolutionaryLine}
            toggleEvolutionaryLine={toggleEvolutionaryLine}
            showCollectUI={showCollectUI}
            toggleCollectUI={() => setShowCollectUI((prev) => !prev)}
            isWide={isWide}
            ownershipFilter={ownershipFilter}
            handleClearOwnershipFilter={handleClearOwnershipFilter}
            updateOwnershipFilter={handleUpdateOwnershipFilter}
            handleFastSelectToggle={handleFastSelectToggle}
            selectAllToggle={selectAllToggle}
            highlightedCards={highlightedCards}
            confirmMoveToFilter={handleConfirmMoveToFilter}
            onListsButtonClick={handleListsButtonClick}
            contextText={contextText}
            isFastSelectEnabled={isFastSelectEnabled}
            isSelectAllEnabled={isSelectAllEnabled}
            // New: Pass the callback that will switch to the Pokédex view
            onPokedexClick={() =>
              setActiveView((prev) => (prev === "pokedex" ? "pokemonList" : "pokedex"))
            }
          />
          {activeView === "lists" ? (
            <ListsMenu 
              onSelectList={handleSelectList}
              activeLists={activeLists}
            />
          ) : (
            <div
              className="view-slider"
              style={{
                transform: activeView === "pokedex" ? "translateX(0)" : "translateX(-100%)"
              }}
            >
              {/* First panel: Pokédex Filters Menu */}
              <div className="slider-panel">
                <PokedexFiltersMenu onSelectFilter={handleSelectPokedexFilter} />
              </div>
              {/* Second panel: Pokémon List */}
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
                />
              </div>
            </div>
          )}

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
