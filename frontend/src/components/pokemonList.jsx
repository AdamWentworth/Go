import React, { useState, useEffect } from 'react';
import './pokemonList.css';
import PokemonOverlay from './pokemonOverlay'; 
import useSearchFilters from './useSearchFilters'; // Import the search filters hook
import { getPokemons } from './api';
import { determinePokemonImage, shouldAddPokemon, formatForm } from './searchHelpers';

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
                <div className="header-section browse-section">
                    <h1>Browse</h1>
                    <input 
                        type="text" 
                        placeholder="Search..."
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}                        
                    />
                    <button onClick={toggleShiny} className={`shiny-button ${isShiny ? 'active' : ''}`}>
                        <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
                    </button>
                    <button onClick={toggleCostume} className={`costume-button ${showCostume ? 'active' : ''}`}>
                        <img src="/images/costume_icon.png" alt="Toggle Costume" />
                    </button>
                    <button onClick={toggleShadow} className={`shadow-button ${showShadow ? 'active' : ''}`}>
                        <img src="/images/shadow_icon.png" alt="Toggle Shadow" />
                    </button>
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
                        {
    displayedPokemons.map((pokemon, index) => {
        if (isShiny && showShadow && (!pokemon.shiny_shadow_image || pokemon.shadow_shiny_available !== 1)) {
            return null;
        }
    
        if (showShadow && !isShiny && !pokemon.shadow_image) {
            return null;
        }

        // Calculate a unique key for each Pokemon
        const apexSuffix = pokemon.shadow_apex === 1 ? `-apex-${index}` : `-default-${index}`;
        const costumeSuffix = `-${pokemon.currentCostumeName || 'default'}-${index}`;

        let pokemonKey = [249, 250].includes(pokemon.pokemon_id)
            ? `${pokemon.pokemon_id}${apexSuffix}`
            : `${pokemon.pokemon_id}${costumeSuffix}`;

        return (
            <div className="pokemon-card"
                key={pokemonKey}
                onClick={() => setSelectedPokemon(pokemon)}
            >
                <img src={pokemon.currentImage} alt={pokemon.name} />
                <p>#{pokemon.pokedex_number}</p>
                <div className="type-icons">
                    {pokemon.type_1_icon && <img src={pokemon.type_1_icon} alt={pokemon.type1_name} />}
                    {pokemon.type_2_icon && <img src={pokemon.type_2_icon} alt={pokemon.type2_name} />}
                </div>
                <h2>
                    {showCostume && pokemon.currentCostumeName
                        ? <span className="pokemon-form">{formatForm(pokemon.currentCostumeName)} </span>
                        : pokemon.form && !singleFormPokedexNumbers.includes(pokemon.pokedex_number) &&
                        <span className="pokemon-form">{formatForm(pokemon.form)} </span>}
                    {pokemon.name}
                </h2>
            </div>
        );
    })
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
