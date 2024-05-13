//pokemonList.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import './PokemonList.css';
import PokemonOverlay from './PokemonOverlay'; 
import useSearchFilters from './hooks/useSearchFilters'; // Import the search filters hook
import FilterUI from './UIComponents/FilterUI';
import SearchUI from './UIComponents/SearchUI';
import CollectUI from './UIComponents/CollectUI';
import SortOverlay from './SortOverlay';
import PokemonCard from './PokemonCard';
import useFetchPokemons from './hooks/useFetchPokemons';
import useSortManager from './hooks/useSortManager';
import useFilterPokemons from './hooks/useFilterPokemons';
import { getFilteredPokemonsByOwnership } from './utils/pokemonOwnershipManager';

function PokemonList() {

    // State for selected pokemon click listener for Overlay
    const [selectedPokemon, setSelectedPokemon] = useState(null);

    // State for Evolutionary line toggle
    const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(false);
    
    // State for managing Fast Select
    const [isFastSelectEnabled, setIsFastSelectEnabled] = useState(false);

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

    // State for Sort Type and Mode
    const [sortType, setSortType] = useState('number');  // Updated to manage different sort types
    const [sortMode, setSortMode] = useState('ascending');     // Default to 'ascending', removed 'off' mode

    // States for showing the Filters and Collect UI features
    const [showFilterUI, setShowFilterUI] = useState(false);
    const [showCollectUI, setShowCollectUI] = useState(false);

    // State for noticing window width
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Pokemon who by default will only show 1 of many forms
    const singleFormPokedexNumbers = [201, 649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741];

    // Initial pokemon variants collecting from API or local storage
    const { variants, loading } = useFetchPokemons();

    // Ownership
    const [ownershipFilter, setOwnershipFilter] = useState("");
    const updateOwnershipFilter = (filterType) => {
        setOwnershipFilter(prev => prev === filterType ? "" : filterType); // Toggle functionality
    };
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


    // Callbacks
    const toggleEvolutionaryLine = useCallback(() => {
        setShowEvolutionaryLine(prev => !prev);
    }, []);
    
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
    
    const toggleSortMode = useCallback(() => {
        setSortMode((currentMode) => (currentMode + 1) % 3);
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
            <div className={`header ${showCollectUI ? 'expand-collect' : ''}`}>
                <button className="toggle-button" onClick={() => setShowFilterUI(prev => !prev)}>
                    {showFilterUI ? 'Hide' : 'Filters'}
                </button>
                {showFilterUI && (
                    <FilterUI
                        isShiny={isShiny}
                        toggleShiny={toggleShiny}
                        showCostume={showCostume}
                        toggleCostume={toggleCostume}
                        showShadow={showShadow}
                        toggleShadow={toggleShadow}
                        toggleShowAll={toggleShowAll}
                    />
                )}
                <SearchUI
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    showEvolutionaryLine={showEvolutionaryLine}
                    toggleEvolutionaryLine={toggleEvolutionaryLine}
                />
                {showCollectUI && (
                    <CollectUI 
                        statusFilter={ownershipFilter} 
                        setStatusFilter={updateOwnershipFilter} 
                        onFastSelectToggle={handleFastSelectToggle} 
                        onSelectAll={selectAllToggle}
                    />
                )}
                <button className="toggle-button collect-ui-toggle" onClick={() => setShowCollectUI(prev => !prev)}>
                    {showCollectUI ? 'Hide' : 'Collect'}
                </button>
            </div>

            <div className="pokemon-container">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        {
                            sortedPokemons.map((pokemon) => (
                                <PokemonCard
                                    key={pokemon.pokemonKey} // Directly use the pre-generated key
                                    pokemon={pokemon}
                                    onSelect={() => {
                                        if (isFastSelectEnabled) {
                                            toggleCardHighlight(pokemon.pokemonKey);
                                        } else {
                                            setSelectedPokemon(pokemon);
                                        }
                                    }}
                                    isHighlighted={highlightedCards.has(pokemon.pokemonKey)}
                                    isShiny={isShiny}
                                    showShadow={showShadow}
                                    singleFormPokedexNumbers={singleFormPokedexNumbers}
                                    ownershipFilter={ownershipFilter}
                                />
                            ))
                        }
                        {selectedPokemon && (
                            <PokemonOverlay 
                                pokemon={selectedPokemon} 
                                onClose={() => setSelectedPokemon(null)}
                                setSelectedPokemon={setSelectedPokemon}
                                allPokemons={variants}
                            />
                        )}
                    </>
                )}
            </div>
            <SortOverlay sortType={sortType} setSortType={setSortType} sortMode={sortMode} setSortMode={setSortMode} />
        </div>
    );
}

export default PokemonList;
