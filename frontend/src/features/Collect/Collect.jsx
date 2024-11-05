// Collect.jsx

import React, { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PokemonList from './PokemonList';
import HeaderUI from './HeaderUI';
import SortOverlay from './SortOverlay';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { multiFormPokedexNumbers } from '../../utils/constants';
import UserSearchContext from '../../contexts/UserSearchContext';
import { initializePokemonLists } from './PokemonOwnership/PokemonTradeListOperations';

import useUserDataLoader from './hooks/useUserDataLoader';
import useInstanceIdProcessor from './hooks/useInstanceIdProcessor';
import useResponsiveUI from './hooks/useResponsiveUI';
import useSearchFilters from '../../hooks/search/useSearchFilters';
import { useUIControls } from './hooks/useUIControls';
import useUIHandlers from './hooks/useUIHandlers';
import usePokemonProcessing from './hooks/usePokemonProcessing';

import LoadingSpinner from '../../components/LoadingSpinner'; // Added import

const PokemonListMemo = React.memo(PokemonList);
const HeaderUIMemo = React.memo(HeaderUI);
const SortOverlayMemo = React.memo(SortOverlay);

function Collect({ isOwnCollection }) {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isUsernamePath = !isOwnCollection && Boolean(username);

  const {
    viewedOwnershipData,
    userExists,
    viewedLoading,
    fetchUserOwnershipData,
    setUserExists,
    setViewedOwnershipData,
  } = useContext(UserSearchContext);

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
    sortType,
    setSortType,
    sortMode,
    toggleSortMode,
  } = useUIControls({
    showFilterUI: false,
    showCollectUI: false,
    showEvolutionaryLine: false,
    isFastSelectEnabled: false,
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
  useResponsiveUI(setShowFilterUI, setShowCollectUI);

  // Use custom hook to load user data
  useUserDataLoader({
    isUsernamePath,
    username,
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
    handleMoveHighlightedToFilter,
    toggleShowAll,
    handleConfirmMoveToFilter,
  } = useUIHandlers({
    setOwnershipFilter,
    setIsShiny,
    setShowCostume,
    setShowShadow,
    setIsFastSelectEnabled,
    setHighlightedCards,
    setShowAll,
    highlightedCards,
    sortedPokemons,
    updateOwnership,
    variants,
    ownershipData,
  });

  return (
    <div>
      {/* Render "User not found" only if `isUsernamePath` is true and `userExists` is explicitly false */}
      {isUsernamePath && userExists === false && <h1>User not found</h1>}

      {/* Show loading spinner if data is still loading */}
      {(loading || viewedLoading) && <LoadingSpinner />}

      {/* Render content if user exists, or if viewing own collection */}
      {(isOwnCollection || userExists) && !loading && !viewedLoading && (
        <>
          <HeaderUIMemo
            isEditable={isEditable}
            username={username}
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
            ownershipFilter={ownershipFilter}
            updateOwnershipFilter={handleUpdateOwnershipFilter}
            handleFastSelectToggle={handleFastSelectToggle}
            selectAllToggle={selectAllToggle}
            highlightedCards={highlightedCards}
            confirmMoveToFilter={handleConfirmMoveToFilter}
          />
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
          />
          <SortOverlayMemo
            sortType={sortType}
            setSortType={setSortType}
            sortMode={sortMode}
            setSortMode={toggleSortMode}
          />
        </>
      )}
    </div>
  );
}

export default Collect;