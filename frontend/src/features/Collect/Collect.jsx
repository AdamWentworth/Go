// Collect.jsx

import React, { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const isUsernamePath = !isOwnCollection;

    const { viewedOwnershipData, userExists, viewedLoading, fetchUserOwnershipData } = useContext(UserSearchContext);
    const { variants, ownershipData: contextOwnershipData, lists: defaultLists, loading, updateOwnership, updateLists } = usePokemonData();
    const ownershipData = isOwnCollection ? contextOwnershipData : viewedOwnershipData;
    const [ownershipFilter, setOwnershipFilter] = useState(isUsernamePath ? "Owned" : "");

    // Reset ownership filter to "Owned" when switching to a new /:username search
    useEffect(() => {
        if (isUsernamePath) {
            setOwnershipFilter("Owned");
            setShowAll(true)
        }
    }, [username, isUsernamePath]);

    // Fetch user ownership data for the /:username path if it hasn’t already been loaded
    useEffect(() => {
        if (isUsernamePath && !viewedOwnershipData && username) {
            fetchUserOwnershipData(username);
        }
    }, [isUsernamePath, username, viewedOwnershipData, fetchUserOwnershipData]);

    // Initialize lists based on data context
    const activeLists = useMemo(() => {
        return isUsernamePath && viewedOwnershipData
            ? initializePokemonLists(viewedOwnershipData, variants)
            : defaultLists;
    }, [isUsernamePath, viewedOwnershipData, variants, defaultLists]);

    // Set `isEditable` based solely on the `isOwnCollection` prop
    const isEditable = isOwnCollection;

    // Component state and UI controls
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [highlightedCards, setHighlightedCards] = useState(new Set());
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showAll, setShowAll] = useState(false);

    const { showFilterUI, setShowFilterUI, showCollectUI, setShowCollectUI, showEvolutionaryLine, toggleEvolutionaryLine, isFastSelectEnabled, setIsFastSelectEnabled, sortType, setSortType, sortMode, toggleSortMode } = useUIControls({
        showFilterUI: false,
        showCollectUI: false,
        showEvolutionaryLine: false,
        isFastSelectEnabled: false,
        sortType: 'number',
        sortMode: 'ascending'
    });

    const { isShiny, setIsShiny, showShadow, setShowShadow, selectedGeneration, setSelectedGeneration, searchTerm, setSearchTerm, showCostume, setShowCostume, generations, pokemonTypes } = useSearchFilters(variants);

    // Filtering and sorting functions
    const filteredVariants = useMemo(() => {
        if (ownershipFilter) {
            return getFilteredPokemonsByOwnership(variants, ownershipData, ownershipFilter, activeLists);
        }
        return variants;
    }, [variants, ownershipData, ownershipFilter, activeLists]);

    const filters = useMemo(() => ({
        selectedGeneration, isShiny, searchTerm, showCostume, showShadow, multiFormPokedexNumbers, pokemonTypes, generations
    }), [selectedGeneration, isShiny, searchTerm, showCostume, showShadow, multiFormPokedexNumbers, pokemonTypes, generations]);

    const displayedPokemons = useFilterPokemons(filteredVariants, filters, showEvolutionaryLine, showAll);
    const sortedPokemons = useSortManager(displayedPokemons, sortType, sortMode, { isShiny, showShadow, showCostume, showAll });

    // Filter and select controls
    const handleUpdateOwnershipFilter = useCallback((filterType) => {
        const allowedFilters = ["Owned", "Unowned", "Trade", "Wanted"];
        if (isUsernamePath && allowedFilters.includes(filterType)) {
            setOwnershipFilter(filterType);
        } else if (!isUsernamePath) {
            setOwnershipFilter(prev => prev === filterType ? "" : filterType);
        }
    }, [isUsernamePath]);

    const toggleShowAll = useCallback(() => setShowAll(prevShowAll => !prevShowAll), [showAll]);
    const toggleShiny = useCallback(() => setIsShiny(prevState => !prevState), []);
    const toggleCostume = useCallback(() => setShowCostume(prevState => !prevState), []);
    const toggleShadow = useCallback(() => setShowShadow(prevState => !prevState), []);
    const handleFastSelectToggle = useCallback((enabled) => setIsFastSelectEnabled(enabled), []);
    
    // User interaction functions
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
    }, [highlightedCards, updateOwnership, updateLists]);

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
            {!userExists && <h1>User not found</h1>}
            {(loading || viewedLoading) && <LoadingSpinner />}
            {userExists && !loading && !viewedLoading && (
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