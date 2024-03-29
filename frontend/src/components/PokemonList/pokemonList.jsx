//pokemonList.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './pokemonList.css';
import PokemonOverlay from './pokemonOverlay'; 
import useSearchFilters from '../hooks/useSearchFilters'; // Import the search filters hook
import SearchUI from './searchUI';
import CollectUI from './collectUI';
import PokemonCard from './pokemonCard';
import useFetchPokemons from '../hooks/useFetchPokemons';
import useSortedPokemons from '../hooks/useSortedPokemons';
import useConditionalPokemons from '../hooks/useConditionalPokemons';
import { determinePokemonKey } from '../../utils/imageHelpers';


function pokemonList() {
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(false);
    const [sortMode, setSortMode] = useState(0); // Ensure this state is declared

    const { allPokemons, loading } = useFetchPokemons();

    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        console.log('Show All state is now:', showAll);
      }, [showAll]);

      const toggleShowAll = useCallback(() => {
        setShowAll(prevShowAll => !prevShowAll);

        if (!showAll) {
            setIsShiny(false);
            setShowCostume(false);
            setShowShadow(false);
        }
    }, [showAll]);
    
    const [statusFilter, setStatusFilter] = useState("");
    
    const singleFormPokedexNumbers = [201, 649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741];
    
    const {
        isShiny, setIsShiny, showShadow, setShowShadow, 
        selectedGeneration, setSelectedGeneration, searchTerm, setSearchTerm,
        showCostume, setShowCostume, generations, pokemonTypes,
        isTypeSearch, isGenerationSearch
    } = useSearchFilters(allPokemons);
    
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

    const displayedPokemons = useConditionalPokemons(allPokemons, filters, showEvolutionaryLine, showAll);

    const sortedPokemons = useSortedPokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume });

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
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter} 
                />
            </div>

            <div className="pokemon-container">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        {sortedPokemons.map((pokemon) => {
                            // Generate a unique key for each pokemon here, inside the map function
                            const pokemonKey = determinePokemonKey(pokemon);

                            return (
                                <PokemonCard
                                    key={pokemonKey} // Use the unique key here
                                    pokemonKey={pokemonKey}
                                    pokemon={pokemon}
                                    setSelectedPokemon={setSelectedPokemon}
                                    isShiny={isShiny}
                                    showShadow={showShadow}
                                    singleFormPokedexNumbers={singleFormPokedexNumbers}
                                />
                            );
                        })}
                        {selectedPokemon && (
                            <PokemonOverlay 
                                pokemon={selectedPokemon} 
                                onClose={() => setSelectedPokemon(null)}
                                setSelectedPokemon={setSelectedPokemon}
                                allPokemons={allPokemons}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default pokemonList;
