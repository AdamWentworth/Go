//pokemonList.jsx

import React, { useState } from 'react';
import './pokemonList.css';
import PokemonOverlay from './pokemonOverlay'; 
import useSearchFilters from '../hooks/useSearchFilters'; // Import the search filters hook
import SearchUI from './searchUI';
import PokemonCard from './pokemonCard';
import useFetchPokemons from '../hooks/useFetchPokemons';
import useFilterPokemons from '../hooks/useFilterPokemons';


function pokemonList() {
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    
    const { allPokemons, loading } = useFetchPokemons();
    
    const singleFormPokedexNumbers = [649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741];
    
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

    const displayedPokemons = useFilterPokemons(allPokemons, filters);

    const toggleShiny = () => {
        setIsShiny(prevState => !prevState);
    };

    const toggleCostume = () => { // 2. Toggle function for costume state
        setShowCostume(prevState => !prevState);
    };

    const toggleShadow = () => {
        setShowShadow(prevState => !prevState);
    };   
     
    return (
        <div>
            <div className="header">
                <SearchUI
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    isShiny={isShiny}
                    toggleShiny={toggleShiny}
                    showCostume={showCostume}
                    toggleCostume={toggleCostume}
                    showShadow={showShadow}
                    toggleShadow={toggleShadow}
                />
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
                {displayedPokemons.map((pokemon, index) => (
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
                />
                }
                </>
                )}
            </div>
        </div>
    );
}


export default pokemonList;
