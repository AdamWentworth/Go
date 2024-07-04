//Collect.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useUIControls } from './hooks/useUIControls'; // Import the new hook
import PokemonList from './PokemonList';
import useSearchFilters from './hooks/useSearchFilters'; // Import the search filters hook
import HeaderUI from './HeaderUI';
import SortOverlay from './SortOverlay';
import { usePokemonData } from '../../contexts/PokemonDataContext'; // Import the context hook
import useSortManager from './hooks/useSortManager';
import useFilterPokemons from './hooks/useFilterPokemons';
import { confirmMoveToFilter } from './PokemonOwnership/pokemonOwnershipManager';
import { getFilteredPokemonsByOwnership } from './PokemonOwnership/PokemonOwnershipFilter';

const PokemonListMemo = React.memo(PokemonList);
const HeaderUIMemo = React.memo(HeaderUI);
const SortOverlayMemo = React.memo(SortOverlay);

function Collect() {
    console.log('Collect component mounting');

    //States
    const { variants, ownershipData, lists, loading, updateOwnership, updateLists } = usePokemonData();

    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [highlightedCards, setHighlightedCards] = useState(new Set());
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [ownershipFilter, setOwnershipFilter] = useState("");
    const [showAll, setShowAll] = useState(false);

    // Pokemon who by default will only show 1 of many forms
    const singleFormPokedexNumbers = [201, 649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741];

    // UI Controls
    const {
        showFilterUI, setShowFilterUI, toggleFilterUI, 
        showCollectUI, setShowCollectUI, toggleCollectUI,
        showEvolutionaryLine, toggleEvolutionaryLine,
        isFastSelectEnabled, setIsFastSelectEnabled, toggleFastSelect,
        sortType, setSortType, sortMode, toggleSortMode
    } = useUIControls({
        showFilterUI: false,
        showCollectUI: false,
        showEvolutionaryLine: false,
        isFastSelectEnabled: false,
        sortType: 'number',
        sortMode: 'ascending'
    });

    // Search Filters
    const {
        isShiny, setIsShiny, 
        showShadow, setShowShadow, 
        selectedGeneration, setSelectedGeneration, 
        searchTerm, setSearchTerm,
        showCostume, setShowCostume, 
        generations, isGenerationSearch,
        pokemonTypes, isTypeSearch
    } = useSearchFilters(variants);

    // Handle filtered and sorted pokemon display
    const filteredVariants = useMemo(() => {
        // console.log('Ownership Data before filtering:', ownershipData);
        if (ownershipFilter) {
            console.log("Filtering variants based on ownership:", ownershipFilter);
            return getFilteredPokemonsByOwnership(variants, ownershipData, ownershipFilter);
        }
        return variants; // No filter: use original variants data
    }, [variants, ownershipData, ownershipFilter]);

    // Search Filters Memo
    const filters = useMemo(() => ({
        selectedGeneration, isShiny, searchTerm, showCostume, showShadow,
        singleFormPokedexNumbers, pokemonTypes, generations
    }), [selectedGeneration, isShiny, searchTerm, showCostume, showShadow, singleFormPokedexNumbers, pokemonTypes, generations]);

    // Filter Pokemon
    const displayedPokemons = useFilterPokemons(filteredVariants, filters, showEvolutionaryLine, showAll);
    
    // Sort Pokemon
    const sortedPokemons = useSortManager(displayedPokemons, sortType, sortMode, { isShiny, showShadow, showCostume, showAll });

    // Toggle Selecting cards with Highlight
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

    // Handle Updating ownership Filter
    const handleUpdateOwnershipFilter = useCallback((filterType) => {
        setOwnershipFilter(prev => prev === filterType ? "" : filterType);
    }, [setOwnershipFilter]);

    // Toggle Show All State interacting with common Filter States
    const toggleShowAll = useCallback(() => {
        setShowAll(prevShowAll => !prevShowAll);

        if (!showAll) {
            setIsShiny(false);
            setShowCostume(false);
            setShowShadow(false);
        }
    }, [showAll]);
    
    // Toggle Shiny State
    const toggleShiny = useCallback(() => {
        setIsShiny(prevState => !prevState);
        setShowAll(false);
    }, []);
    
    // Toggle Costume State
    const toggleCostume = useCallback(() => {
        setShowCostume(prevState => !prevState);
        setShowAll(false);
    }, []);

    // Toggle Shadow State
    const toggleShadow = useCallback(() => {
        setShowShadow(prevState => !prevState);
        setShowAll(false);
    }, []);

    // Handler to toggle fast select mode from CollectUI
    const handleFastSelectToggle = useCallback((enabled) => {
        setIsFastSelectEnabled(enabled);
    }, []);

    // Toggle Select All from CollectUI
    const selectAllToggle = useCallback(() => {
        if (highlightedCards.size === sortedPokemons.length) {
            setHighlightedCards(new Set()); // Clears all highlights if all are currently selected
        } else {
            const allPokemonIds = new Set(sortedPokemons.map(pokemon => pokemon.pokemonKey));
            setHighlightedCards(allPokemonIds); // Selects all IDs
        }
    }, [sortedPokemons, highlightedCards]);    

    // Updating highlighted pokemon to new Ownership filter: now using updateOwnership
    const handleMoveHighlightedToFilter = useCallback(filter => {
        updateOwnership([...highlightedCards], filter);
        setHighlightedCards(new Set());
        setOwnershipFilter(filter);  // Assuming this sets the current filter state
    }, [highlightedCards, updateOwnership, updateLists]);    

    // // Handler for confirming the move to new Ownership filter
    const handleConfirmMoveToFilter = useCallback((filter) => {
        confirmMoveToFilter(() => handleMoveHighlightedToFilter(filter), filter, highlightedCards, variants, ownershipData);
    }, [handleMoveHighlightedToFilter, highlightedCards, variants, ownershipData]);    

    // Effect to handle window resizing
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Automatically set UI visibility based on window width
    useEffect(() => {
        console.log("Window width changed:", windowWidth);
        const isWide = windowWidth >= 1024;
        setShowFilterUI(isWide); // Always show filters on wide screens
        setShowCollectUI(isWide); // Always show collect UI on wide screens
    }, [windowWidth]);  
    
    if (loading) {
        return <div>Loading...</div>; // Or any other loading indicator
    }
     
    return (
        <div>
            <HeaderUIMemo
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
                singleFormPokedexNumbers={[201, 649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741]}
                ownershipFilter={ownershipFilter}
                lists={lists}
                ownershipData={ownershipData}
            />
            <SortOverlayMemo
                sortType={sortType}
                setSortType={setSortType}
                sortMode={sortMode}
                setSortMode={toggleSortMode}
            />
        </div>
    );
}

export default Collect;
