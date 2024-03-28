//pokemonList.jsx

import React, { useState, useMemo } from 'react'; // Ensure useMemo is imported
import './pokemonList.css';
import PokemonOverlay from './pokemonOverlay'; 
import useSearchFilters from '../hooks/useSearchFilters'; // Import the search filters hook
import SearchUI from './searchUI';
import CollectUI from './collectUI';
import PokemonCard from './pokemonCard';
import useFetchPokemons from '../hooks/useFetchPokemons';
import useFilterPokemons from '../hooks/useFilterPokemons';
import useSortedPokemons from '../hooks/useSortedPokemons';


function pokemonList() {
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(false);
    const [sortMode, setSortMode] = useState(0); // Ensure this state is declared

    const { allPokemons, loading } = useFetchPokemons();

    const [statusFilter, setStatusFilter] = useState("");
    
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
    const sortedPokemons = useSortedPokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume });

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
                <CollectUI 
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter} 
                />
            </div>

            <div className="pokemon-container">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                {sortedPokemons.map((pokemon) => (
                    <PokemonCard
                        key={`${pokemon.id}-${pokemon.isShiny ? 'shiny' : 'normal'}-${pokemon.showShadow ? 'shadow' : 'normal'}-${pokemon.costumeName || 'default'}`}
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
