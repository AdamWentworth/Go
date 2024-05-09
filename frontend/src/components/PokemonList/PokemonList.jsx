//pokemonList.jsx

import React, { useState, useMemo, useCallback } from 'react';
import './PokemonList.css';
import PokemonOverlay from './PokemonOverlay'; 
import useSearchFilters from './hooks/useSearchFilters'; // Import the search filters hook
import SearchUI from './SearchUI';
import CollectUI from './CollectUI';
import PokemonCard from './PokemonCard';
import useFetchPokemons from './hooks/useFetchPokemons';
import useSortedPokemons from './hooks/useSortedPokemons';
import useFilterPokemons from './hooks/useFilterPokemons';
import { getFilteredPokemonsByOwnership } from './utils/pokemonOwnershipManager';

function PokemonList() {

    // State for selected pokemon click listener for Overlay
    const [selectedPokemon, setSelectedPokemon] = useState(null);

    // State for Evolutionary line toggle
    const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(false);

    // State for Sort Mode
    const [sortMode, setSortMode] = useState(0);

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
    const sortedPokemons = useSortedPokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll });


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
    
     
    return (
        <div>
            <div className="header">
                <div className="search-ui">
                <SearchUI
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    isShiny={isShiny}
                    toggleShiny={toggleShiny}
                    showCostume={showCostume}
                    toggleCostume={toggleCostume}
                    showShadow={showShadow}
                    toggleShadow={toggleShadow}
                    showEvolutionaryLine={showEvolutionaryLine}
                    toggleEvolutionaryLine={toggleEvolutionaryLine}
                    sortMode={sortMode} // Pass sortMode to SearchUI
                    toggleSortMode={toggleSortMode} // Pass toggleSortMode to SearchUI
                    toggleShowAll={toggleShowAll}
                />
                </div>
                <CollectUI 
                    statusFilter={ownershipFilter} 
                    setStatusFilter={updateOwnershipFilter} 
                />
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
                                    setSelectedPokemon={setSelectedPokemon}
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
        </div>
    );
}

export default PokemonList;
