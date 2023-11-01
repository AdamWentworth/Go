import React, { useState, useEffect } from 'react';
import './pokemonList.css';
import PokemonOverlay from './pokemonOverlay'; 
import useSearchFilters from '../hooks/useSearchFilters'; // Import the search filters hook
import { getPokemons } from '../../utils/api';
import { shouldAddPokemon, formatForm } from '../../utils/searchFunctions';
import SearchUI from './searchUI';
import PokemonCard from './pokemonCard';
import { determinePokemonImage } from '../../utils/imageHelpers'


function pokemonList() {
    // console.log("Collect component rendered");
    const [allPokemons, setAllPokemons] = useState([]);
    const [displayedPokemons, setDisplayedPokemons] = useState([]);
    const [loading, setLoading] = useState(true);
    const singleFormPokedexNumbers = [649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741]; // Add specific numbers as per your requirement.
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const {
        isShiny, setIsShiny, showShadow, setShowShadow, 
        selectedGeneration, setSelectedGeneration, searchTerm, setSearchTerm,
        showCostume, setShowCostume, generations, pokemonTypes,
        isTypeSearch, isGenerationSearch
    } = useSearchFilters(allPokemons);

    useEffect(() => {
        getPokemons()
            .then(data => {
                console.log("API Response: ", data);
                setAllPokemons(data);
                setDisplayedPokemons(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching the Pokémon data: ", error);
                setLoading(false);
            });
    }, []);    
    
    useEffect(() => {
        const filteredPokemons = allPokemons.reduce((acc, pokemon) => {
            const shadowCostumes = [20, 33, 143, 403];
        
            if (!singleFormPokedexNumbers.includes(pokemon.pokedex_number) || !acc.some(p => p.pokedex_number === pokemon.pokedex_number)) {
                if (showCostume && pokemon.costumes) {
                    pokemon.costumes.forEach(costume => {
                        if (shouldAddPokemon(pokemon, costume, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow)) { 
                            const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow, costume);
                            acc.push({ 
                                ...pokemon, 
                                currentImage: imageToUse,
                                currentCostumeName: costume.name 
                            });
                        }
                    });
                } else {
                    if (shouldAddPokemon(pokemon, null, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow)) { 
                        const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow);
                        acc.push({ 
                            ...pokemon, 
                            currentImage: imageToUse
                        });
                    }
                }
            }            
            return acc;
        }, []);
    
        setDisplayedPokemons(filteredPokemons);
    }, [selectedGeneration, isShiny, allPokemons, searchTerm, showCostume, showShadow]);

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
                        {
    displayedPokemons.map((pokemon, index) => (
        <PokemonCard
            key={index}
            pokemon={pokemon}
            setSelectedPokemon={setSelectedPokemon}
            isShiny={isShiny}
            showShadow={showShadow}
            singleFormPokedexNumbers={singleFormPokedexNumbers}
        />
    ))
}

{selectedPokemon &&
    <PokemonOverlay pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />
}
</>
)}
</div>
</div>
);
}


export default pokemonList;
