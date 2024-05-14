//Collect.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useUIControls } from './hooks/useUIControls'; // Import the new hook
import PokemonList from './PokemonList';
import useSearchFilters from './hooks/useSearchFilters'; // Import the search filters hook
import HeaderUI from './HeaderUI';
import SortOverlay from './SortOverlay';
import useFetchPokemons from './hooks/useFetchPokemons';
import useSortManager from './hooks/useSortManager';
import useFilterPokemons from './hooks/useFilterPokemons';
import { loadOwnershipData, updateOwnershipFilter, moveHighlightedToFilter, confirmMoveToFilter, getFilteredPokemonsByOwnership, updatePokemonOwnership } from './utils/pokemonOwnershipManager';

function Collect() {

    // State for selected pokemon click listener for Overlay
    const [selectedPokemon, setSelectedPokemon] = useState(null);

    const {
        showFilterUI,
        setShowFilterUI,
        toggleFilterUI,
        showCollectUI,
        setShowCollectUI,
        toggleCollectUI,
        showEvolutionaryLine,
        toggleEvolutionaryLine,
        isFastSelectEnabled,
        setIsFastSelectEnabled,
        toggleFastSelect,
        sortType,
        setSortType,
        sortMode,
        toggleSortMode
    } = useUIControls({
        showFilterUI: false,
        showCollectUI: false,
        showEvolutionaryLine: false,
        isFastSelectEnabled: false,
        sortType: 'number',
        sortMode: 'ascending'
    });

    const [highlightedCards, setHighlightedCards] = useState(new Set());

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

    // State for noticing window width
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Pokemon who by default will only show 1 of many forms
    const singleFormPokedexNumbers = [201, 649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741];

    // Initial pokemon variants collecting from API or local storage
    const { variants, loading } = useFetchPokemons();

    // Ownership
    const [ownershipFilter, setOwnershipFilter] = useState("");

    const handleUpdateOwnershipFilter = useCallback((filterType) => {
        updateOwnershipFilter(setOwnershipFilter, filterType);
    }, [setOwnershipFilter]);

    const [ownershipData, setOwnershipData] = useState({});

    useEffect(() => {
        loadOwnershipData(setOwnershipData);
    }, []);

    const filteredVariants = useMemo(() => {
        return ownershipFilter ? getFilteredPokemonsByOwnership(variants, ownershipFilter) : variants;
    }, [variants, ownershipFilter]);     

    // Show All
    const [showAll, setShowAll] = useState(false);
    const toggleShowAll = useCallback(() => {
        setShowAll(prevShowAll => !prevShowAll);

        if (!showAll) {
            setIsShiny(false);
            setShowCostume(false);
            setShowShadow(false);
        }
    }, [showAll]);
    
    // Search Filters
    const {
        isShiny, setIsShiny, showShadow, setShowShadow, 
        selectedGeneration, setSelectedGeneration, searchTerm, setSearchTerm,
        showCostume, setShowCostume, generations, pokemonTypes,
        isTypeSearch, isGenerationSearch
    } = useSearchFilters(variants);
    
    const filters = useMemo(() => ({
        selectedGeneration,
        isShiny,
        searchTerm,
        showCostume,
        showShadow,
        singleFormPokedexNumbers,
        pokemonTypes,
        generations
    }), [selectedGeneration, isShiny, searchTerm, showCostume, showShadow, singleFormPokedexNumbers, pokemonTypes, generations]);

    // Filter Pokemon
    const displayedPokemons = useFilterPokemons(filteredVariants, filters, showEvolutionaryLine, showAll);

    // Sort Pokemon
    const sortedPokemons = useSortManager(displayedPokemons, sortType, sortMode, { isShiny, showShadow, showCostume, showAll });
    
    const toggleShiny = useCallback(() => {
        setIsShiny(prevState => !prevState);
        setShowAll(false);
    }, []);
    
    const toggleCostume = useCallback(() => {
        setShowCostume(prevState => !prevState);
        setShowAll(false);
    }, []);
    
    const toggleShadow = useCallback(() => {
        setShowShadow(prevState => !prevState);
        setShowAll(false);
    }, []);

    // Handler to toggle fast select mode from CollectUI
    const handleFastSelectToggle = useCallback((enabled) => {
        setIsFastSelectEnabled(enabled);
    }, []);

    const selectAllToggle = useCallback(() => {
        if (highlightedCards.size === sortedPokemons.length) {
            setHighlightedCards(new Set()); // Clears all highlights if all are currently selected
        } else {
            const allPokemonIds = new Set(sortedPokemons.map(pokemon => pokemon.pokemonKey));
            setHighlightedCards(allPokemonIds); // Selects all IDs
        }
    }, [sortedPokemons, highlightedCards]);    

    const handleMoveHighlightedToFilter = useCallback((filter) => {
        moveHighlightedToFilter(highlightedCards, setHighlightedCards, () => loadOwnershipData(setOwnershipData), setOwnershipFilter, filter);
    }, [highlightedCards, setHighlightedCards, setOwnershipData, setOwnershipFilter]); 

    const handleConfirmMoveToFilter = useCallback((filter) => {
        confirmMoveToFilter(() => handleMoveHighlightedToFilter(filter), filter);
    }, [handleMoveHighlightedToFilter]);    

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
        const isWide = windowWidth >= 1024;
        setShowFilterUI(isWide); // Always show filters on wide screens
        setShowCollectUI(isWide); // Always show collect UI on wide screens
    }, [windowWidth]);    
     
    return (
        <div>
            <HeaderUI
                showFilterUI={showFilterUI}
                toggleFilterUI={() => setShowFilterUI(prev => !prev)}
                isShiny={isShiny}
                toggleShiny={toggleShiny}
                showCostume={showCostume}
                toggleCostume={toggleCostume}
                showShadow={showShadow}
                toggleShadow={toggleShadow}
                toggleShowAll={toggleShowAll}

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
            <PokemonList
                sortedPokemons={sortedPokemons}
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
            />
            <SortOverlay
                sortType={sortType}
                setSortType={setSortType}
                sortMode={sortMode}
                setSortMode={toggleSortMode}
            />
        </div>
    );
}

export default Collect;
