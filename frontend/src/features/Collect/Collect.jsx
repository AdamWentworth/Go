// Collect.jsx

import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

// Components for Collect
import PokemonList from './PokemonList';
import ListsMenu from './ListsMenu';
import HeaderUI from './HeaderUI';
import SortOverlay from './SortOverlay';
import HighlightActionButton from './HighlightActionButton';

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
        const canonical = await fetchUserOwnershipData(urlUsername);
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
    setIsSelectAllEnabled
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize the Mega Pokémon handler
  const {
    promptMegaPokemonSelection,
    MegaPokemonModal,
  } = useMegaPokemonHandler(); // Use the custom hook

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
    setIsUpdating: (value) => setIsUpdating(value), // Assuming setIsUpdating is still needed
    promptMegaPokemonSelection,
    promptFusionPokemonSelection,
    setIsFastSelectEnabled,
    setIsSelectAllEnabled,
  });

  const [isShowingLists, setIsShowingLists] = useState(false);

  // Handler for "Lists" button click
  const handleListsButtonClick = () => {
    setIsShowingLists(true);
  };

  // Handler function to clear the ownership filter
  const handleClearOwnershipFilter = () => {
    setOwnershipFilter('');

    if (!isShiny && !showCostume && !showShadow) {
      setShowAll(false);
    }

    // Clear all highlighted cards
    setHighlightedCards(new Set());

    setIsShowingLists(false);
  };

  // Handler for selecting a list in ListsMenu
  const handleSelectList = (filter) => {
    // Clear all highlighted cards
    setHighlightedCards(new Set());

    // Set the ownershipFilter to the selected filter
    setOwnershipFilter(filter);

    // Update showAll based on the new filter
    if (filter === '' && !isShiny && !showCostume && !showShadow) {
      setShowAll(false);
    } else if (!showAll && filter !== '' && !isShiny && !showCostume && !showShadow) {
      setShowAll(true);
    }

    // Close the ListsMenu
    setIsShowingLists(false);
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
          />
          {!isShowingLists ? (
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
          ) : (
            <ListsMenu 
              onSelectList={handleSelectList}
              activeLists={activeLists}
            />
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
