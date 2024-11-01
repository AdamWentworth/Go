// Collect.jsx

import React, { useState, useMemo, useCallback, useEffect, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext';
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
    const { currentUser } = useAuth();

    // Determine if path is /:username
    const isUsernamePath = location.pathname !== '/collect';

    // Destructure based on path
    const {
        viewedOwnershipData,
        userExists,
        viewedLoading,
        fetchUserOwnershipData,
    } = useContext(UserSearchContext);

    const {
        variants,
        ownershipData: contextOwnershipData,
        lists: defaultLists,
        loading,
        updateOwnership,
        updateLists,
    } = usePokemonData();

    // Conditionally set ownership data and fetch data if on /:username path
    const ownershipData = isOwnCollection || !isUsernamePath ? contextOwnershipData : viewedOwnershipData;

    // Fetch if on /:username path and no existing data in context
    useEffect(() => {
        if (isUsernamePath && !viewedOwnershipData && username) {
            fetchUserOwnershipData(username);
        }
    }, [isUsernamePath, username, viewedOwnershipData, fetchUserOwnershipData]);

    const activeLists = useMemo(() => {
        if (isUsernamePath && viewedOwnershipData) {
            return initializePokemonLists(viewedOwnershipData, variants);
        } else {
            return defaultLists;
        }
    }, [isUsernamePath, viewedOwnershipData, variants, defaultLists]);

    const isEditable = isOwnCollection && currentUser?.username;

    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [highlightedCards, setHighlightedCards] = useState(new Set());
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [ownershipFilter, setOwnershipFilter] = useState("");
    const [showAll, setShowAll] = useState(false);

    const {
        showFilterUI, setShowFilterUI,
        showCollectUI, setShowCollectUI,
        showEvolutionaryLine, toggleEvolutionaryLine,
        isFastSelectEnabled, setIsFastSelectEnabled,
        sortType, setSortType, sortMode, toggleSortMode
    } = useUIControls({
        showFilterUI: false,
        showCollectUI: false,
        showEvolutionaryLine: false,
        isFastSelectEnabled: false,
        sortType: 'number',
        sortMode: 'ascending'
    });

    const {
        isShiny, setIsShiny,
        showShadow, setShowShadow,
        selectedGeneration, setSelectedGeneration,
        searchTerm, setSearchTerm,
        showCostume, setShowCostume,
        generations, pokemonTypes
    } = useSearchFilters(variants);

    const filteredVariants = useMemo(() => {
        if (ownershipFilter) {
            const filtered = getFilteredPokemonsByOwnership(variants, ownershipData, ownershipFilter, activeLists);
            // console.log("Filtered Variants:", filtered); // Log to confirm filtering with the correct ownership data
            return filtered;
        }
        // console.log("Variants without filtering:", variants);
        return variants;
    }, [variants, ownershipData, ownershipFilter, activeLists]);

    const filters = useMemo(() => ({
        selectedGeneration, isShiny, searchTerm, showCostume, showShadow,
        multiFormPokedexNumbers, pokemonTypes, generations
    }), [selectedGeneration, isShiny, searchTerm, showCostume, showShadow, multiFormPokedexNumbers, pokemonTypes, generations]);

    const displayedPokemons = useFilterPokemons(filteredVariants, filters, showEvolutionaryLine, showAll);
    // console.log("Displayed Pokemons after filtering:", displayedPokemons); // Log to confirm filtered results

    const sortedPokemons = useSortManager(displayedPokemons, sortType, sortMode, { isShiny, showShadow, showCostume, showAll });
    // console.log("Sorted Pokemons:", sortedPokemons); // Log to confirm sorting on the correct list

    const toggleCardHighlight = useCallback((pokemonId) => {
        setHighlightedCards(prev => {
            const newHighlights = new Set(prev);
            if (newHighlights.has(pokemonId)) {
                newHighlights.delete(pokemonId);
            } else {
                newHighlights.add(pokemonId);
            }
            return newHighlights;
        });
    }, []);

    const handleUpdateOwnershipFilter = useCallback((filterType) => {
        setOwnershipFilter(prev => prev === filterType ? "" : filterType);
    }, [setOwnershipFilter]);

    const toggleShowAll = useCallback(() => {
        setShowAll(prevShowAll => !prevShowAll);
    }, [showAll]);

    const toggleShiny = useCallback(() => {
        setIsShiny(prevState => !prevState);
    }, []);

    const toggleCostume = useCallback(() => {
        setShowCostume(prevState => !prevState);
    }, []);

    const toggleShadow = useCallback(() => {
        setShowShadow(prevState => !prevState);
    }, []);

    const handleFastSelectToggle = useCallback((enabled) => {
        setIsFastSelectEnabled(enabled);
    }, []);

    const selectAllToggle = useCallback(() => {
        if (highlightedCards.size === sortedPokemons.length) {
            setHighlightedCards(new Set());
        } else {
            const allPokemonIds = new Set(sortedPokemons.map(pokemon => pokemon.pokemonKey));
            setHighlightedCards(allPokemonIds);
        }
    }, [sortedPokemons, highlightedCards]);

    const handleMoveHighlightedToFilter = useCallback(filter => {
        updateOwnership([...highlightedCards], filter);
        setHighlightedCards(new Set());
        setOwnershipFilter(filter);
    }, [highlightedCards, updateOwnership, updateLists]);

    const handleConfirmMoveToFilter = useCallback((filter) => {
        confirmMoveToFilter(() => handleMoveHighlightedToFilter(filter), filter, highlightedCards, variants, ownershipData);
    }, [handleMoveHighlightedToFilter, highlightedCards, variants, ownershipData]);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
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
                        ownershipData={isOwnCollection ? contextOwnershipData : viewedOwnershipData}
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