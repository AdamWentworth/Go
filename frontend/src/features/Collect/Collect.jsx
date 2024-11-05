// Collect.jsx

import React, { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useUIControls } from './hooks/useUIControls';
import PokemonList from './PokemonList';
import useSearchFilters from '../../hooks/search/useSearchFilters';
import HeaderUI from './HeaderUI';
import SortOverlay from './SortOverlay';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import useSortManager from '../../hooks/sort/useSortManager';
import useFilterPokemons from '../../hooks/filtering/useFilterPokemons';
import { confirmMoveToFilter } from './PokemonOwnership/pokemonOwnershipManager';
import { getFilteredPokemonsByOwnership } from './PokemonOwnership/PokemonOwnershipFilter';
import LoadingSpinner from '../../components/LoadingSpinner';
import { multiFormPokedexNumbers } from '../../utils/constants';
import UserSearchContext from '../../contexts/UserSearchContext';
import { initializePokemonLists } from './PokemonOwnership/PokemonTradeListOperations';

const PokemonListMemo = React.memo(PokemonList);
const HeaderUIMemo = React.memo(HeaderUI);
const SortOverlayMemo = React.memo(SortOverlay);

function Collect({ isOwnCollection }) {
    const { username } = useParams();
    const location = useLocation(); // To check for state data (instanceId)
    const navigate = useNavigate();
    const isUsernamePath = !isOwnCollection && Boolean(username);

    const { viewedOwnershipData, userExists, viewedLoading, fetchUserOwnershipData } = useContext(UserSearchContext);
    const { variants, ownershipData: contextOwnershipData, lists: defaultLists, loading, updateOwnership, updateLists } = usePokemonData();
    const ownershipData = isOwnCollection ? contextOwnershipData : (viewedOwnershipData || contextOwnershipData);
    const [ownershipFilter, setOwnershipFilter] = useState("");

    // Show all state and toggle function
    const [showAll, setShowAll] = useState(false);
    const toggleShowAll = useCallback(() => setShowAll(prevShowAll => !prevShowAll), []);

    // Set `isEditable` based solely on the `isOwnCollection` prop
    const isEditable = isOwnCollection;

    // Component state and UI controls
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [hasProcessedInstanceId, setHasProcessedInstanceId] = useState(false); // Track if useEffect has executed once
    const [highlightedCards, setHighlightedCards] = useState(new Set());
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const { showFilterUI, setShowFilterUI, showCollectUI, setShowCollectUI, showEvolutionaryLine, toggleEvolutionaryLine, isFastSelectEnabled, setIsFastSelectEnabled, sortType, setSortType, sortMode, toggleSortMode } = useUIControls({
        showFilterUI: false,
        showCollectUI: false,
        showEvolutionaryLine: false,
        isFastSelectEnabled: false,
        sortType: 'number',
        sortMode: 'ascending'
    });

    const { isShiny, setIsShiny, showShadow, setShowShadow, selectedGeneration, setSelectedGeneration, searchTerm, setSearchTerm, showCostume, setShowCostume, generations, pokemonTypes } = useSearchFilters(variants);

    // Load user data when component mounts or when username changes
    useEffect(() => {
        if (isUsernamePath && username) {
            // Prevent API call for non-username paths
            if (['collect', 'discover', 'login', 'register', 'account'].includes(username.toLowerCase())) {
                // Invalid username, do not fetch
                setUserExists(false);
                setViewedOwnershipData(null);
                return;
            }

            const ownershipStatus = location.state?.ownershipStatus;

            if (ownershipStatus) {
                setOwnershipFilter(ownershipStatus);
                fetchUserOwnershipData(username, setOwnershipFilter, setShowAll, ownershipStatus);
            } else {
                fetchUserOwnershipData(username, setOwnershipFilter, setShowAll);
            }
        } else if (!isUsernamePath) {
            // Viewing own collection
            setOwnershipFilter('');
            setShowAll(false);
            // No need to fetch data
        }
    }, [isUsernamePath, username]);

    // Initialize lists based on context data
    const activeLists = useMemo(() => {
        return isUsernamePath && viewedOwnershipData
            ? initializePokemonLists(viewedOwnershipData, variants, true)
            : defaultLists;
    }, [isUsernamePath, viewedOwnershipData, variants, defaultLists]);

    // Filtering and sorting functions
    const filteredVariants = useMemo(() => {
        if (ownershipFilter) {
            return getFilteredPokemonsByOwnership(variants, ownershipData, ownershipFilter, activeLists);
        }
        return variants;
    }, [variants, ownershipData, ownershipFilter, activeLists]);

    // Process instanceId from location state to show a specific Pokémon
    useEffect(() => {
        if (
            viewedLoading ||                // Wait if data is loading
            !viewedOwnershipData ||         // Wait until data is available
            !filteredVariants.length ||     // Ensure there are variants
            isOwnCollection ||              // Skip if viewing own collection
            hasProcessedInstanceId          // Skip if already processed
        ) {
            return;
        }

        const instanceId = location.state?.instanceId;

        if (instanceId && !selectedPokemon) {
            const enrichedPokemonData = filteredVariants.find(pokemon => pokemon.pokemonKey === instanceId);
            const pokemonData = enrichedPokemonData || viewedOwnershipData[instanceId];

            if (pokemonData) {
                setSelectedPokemon({ pokemon: { ...pokemonData, pokemonKey: instanceId }, overlayType: 'instance' });

                setHasProcessedInstanceId(true);

                // Clear instanceId from location state to prevent re-trigger
                navigate(location.pathname, { replace: true, state: { ...location.state, instanceId: null } });
            }
        }
    }, [
        viewedOwnershipData,
        viewedLoading,
        filteredVariants,
        location.state,
        selectedPokemon,
        isOwnCollection,
        hasProcessedInstanceId,
        navigate,
        location.pathname
    ]);

    const filters = useMemo(() => ({
        selectedGeneration, isShiny, searchTerm, showCostume, showShadow, multiFormPokedexNumbers, pokemonTypes, generations
    }), [selectedGeneration, isShiny, searchTerm, showCostume, showShadow, multiFormPokedexNumbers, pokemonTypes, generations]);

    const displayedPokemons = useFilterPokemons(filteredVariants, filters, showEvolutionaryLine, showAll);
    const sortedPokemons = useSortManager(displayedPokemons, sortType, sortMode, { isShiny, showShadow, showCostume, showAll });

    // UI and interaction handlers
    const handleUpdateOwnershipFilter = useCallback((filterType) => {
        setOwnershipFilter(prev => prev === filterType ? "" : filterType);
    }, []);

    const toggleShiny = useCallback(() => setIsShiny(prevState => !prevState), []);
    const toggleCostume = useCallback(() => setShowCostume(prevState => !prevState), []);
    const toggleShadow = useCallback(() => setShowShadow(prevState => !prevState), []);
    const handleFastSelectToggle = useCallback((enabled) => setIsFastSelectEnabled(enabled), []);

    const toggleCardHighlight = useCallback((pokemonId) => {
        setHighlightedCards(prev => {
            const newHighlights = new Set(prev);
            newHighlights.has(pokemonId) ? newHighlights.delete(pokemonId) : newHighlights.add(pokemonId);
            return newHighlights;
        });
    }, []);

    const selectAllToggle = useCallback(() => {
        if (highlightedCards.size === sortedPokemons.length) {
            setHighlightedCards(new Set());
        } else {
            setHighlightedCards(new Set(sortedPokemons.map(pokemon => pokemon.pokemonKey)));
        }
    }, [sortedPokemons, highlightedCards]);

    const handleMoveHighlightedToFilter = useCallback((filter) => {
        updateOwnership([...highlightedCards], filter);
        setHighlightedCards(new Set());
        setOwnershipFilter(filter);
    }, [highlightedCards, updateOwnership]);

    const handleConfirmMoveToFilter = useCallback((filter) => {
        confirmMoveToFilter(() => handleMoveHighlightedToFilter(filter), filter, highlightedCards, variants, ownershipData);
    }, [handleMoveHighlightedToFilter, highlightedCards, variants, ownershipData]);

    // Responsive UI adjustments
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const isWide = windowWidth >= 1024;
        setShowFilterUI(isWide);
        setShowCollectUI(isWide);
    }, [windowWidth]);

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
                        toggleFilterUI={() => setShowFilterUI(prev => !prev)}
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
                        toggleCollectUI={() => setShowCollectUI(prev => !prev)}
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