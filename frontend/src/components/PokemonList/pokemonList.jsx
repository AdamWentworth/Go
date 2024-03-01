//pokemonList.jsx

import React, { useState, useMemo } from 'react'; // Ensure useMemo is imported
import './pokemonList.css';
import PokemonOverlay from './pokemonOverlay'; 
import useSearchFilters from '../hooks/useSearchFilters'; // Import the search filters hook
import SearchUI from './searchUI';
import PokemonCard from './pokemonCard';
import useFetchPokemons from '../hooks/useFetchPokemons';
import useFilterPokemons from '../hooks/useFilterPokemons';


function pokemonList() {
    const [selectedPokemon, setSelectedPokemon] = useState(null);

    const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(false);
    
    const { allPokemons, loading } = useFetchPokemons();

    // Add this state to your existing states in pokemonList.jsx
    const [sortMode, setSortMode] = useState(0); // 0 = off, 1 = newest first, 2 = oldest first
    
    const singleFormPokedexNumbers = [201, 649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741];
    
    const {
        isShiny, setIsShiny, showShadow, setShowShadow, 
        selectedGeneration, setSelectedGeneration, searchTerm, setSearchTerm,
        showCostume, setShowCostume, generations, pokemonTypes,
        isTypeSearch, isGenerationSearch
    } = useSearchFilters(allPokemons);
    
    const filters = {
        selectedGeneration,
        isShiny,
        searchTerm,
        showCostume,
        showShadow,
        singleFormPokedexNumbers,
        pokemonTypes,
        generations
    };

    const displayedPokemons = useFilterPokemons(allPokemons, filters, showEvolutionaryLine);

    const sortedPokemons = useMemo(() => {
        if (sortMode === 0) {
            // No sorting applied
            return displayedPokemons;
        } else {
            // Clone displayedPokemons to avoid directly mutating state
            const pokemonsToSort = [...displayedPokemons];
    
            pokemonsToSort.sort((a, b) => {
                const dateA = new Date(a.date_available);
                const dateB = new Date(b.date_available);
    
                if (sortMode === 1) {
                    // Newest first
                    return dateB - dateA;
                } else if (sortMode === 2) {
                    // Oldest first
                    return dateA - dateB;
                }
            });
    
            return pokemonsToSort;
        }
    }, [displayedPokemons, sortMode]);

    // Function to toggle the evolutionary line checkbox
    const toggleEvolutionaryLine = () => {
        setShowEvolutionaryLine(prev => !prev);
    };    

    const toggleShiny = () => {
        setIsShiny(prevState => !prevState);
    };

    const toggleCostume = () => { // 2. Toggle function for costume state
        setShowCostume(prevState => !prevState);
    };

    const toggleShadow = () => {
        setShowShadow(prevState => !prevState);
    };  
    
    const toggleSortMode = () => {
        setSortMode((currentMode) => (currentMode + 1) % 3);
    };    
     
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
                />
                </div>
                <div className="header-section collect-section">
                    <h1>Collect</h1>
                    {/* Add any other content related to 'Collect' here */}
                </div>
            </div>

            <div className="pokemon-container">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                {sortedPokemons.map((pokemon, index) => (
                    <PokemonCard
                        key={index}
                        pokemon={pokemon}
                        setSelectedPokemon={setSelectedPokemon}
                        isShiny={isShiny}
                        showShadow={showShadow}
                        singleFormPokedexNumbers={singleFormPokedexNumbers}
                    />
                ))}
                {selectedPokemon &&
                    <PokemonOverlay 
                        pokemon={selectedPokemon} 
                        onClose={() => setSelectedPokemon(null)}
                        setSelectedPokemon={setSelectedPokemon} // Pass it here
                        allPokemons={allPokemons}
                    />
                }
                </>
                )}
            </div>
        </div>
    );
}

export default pokemonList;
