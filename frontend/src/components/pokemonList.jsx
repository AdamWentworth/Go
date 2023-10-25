import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './pokemonList.css';
import PokemonOverlay from './pokemonOverlay'; 

function pokemonList() {
    // console.log("Collect component rendered");
    const [allPokemons, setAllPokemons] = useState([]);
    const [displayedPokemons, setDisplayedPokemons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isShiny, setIsShiny] = useState(false);
    const [showShadow, setShowShadow] = useState(false); 
    const [selectedGeneration, setSelectedGeneration] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const singleFormPokedexNumbers = [649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741]; // Add specific numbers as per your requirement.
    const [selectedPokemon, setSelectedPokemon] = useState(null);

    function determinePokemonImage(pokemon, isShiny, showShadow, costume) {
        let image;
        if (costume) {
            if (isShiny && showShadow) {
                image = costume.shiny_shadow_image;
            } else if (isShiny) {
                image = costume.shiny_image;
            } else if (showShadow) {
                image = costume.shadow_image;
            } else {
                image = costume.image;
            }
        } else {
            if (isShiny && showShadow) {
                image = pokemon.shiny_shadow_image;
            } else if (isShiny) {
                image = pokemon.shiny_image;
            } else if (showShadow) {
                image = pokemon.shadow_image;
            } else {
                image = pokemon.image;
            }
        }
        return image;
    }
    
    function shouldAddPokemon(pokemon, costume) {
        const matchesGeneration = selectedGeneration ? pokemon.generation === selectedGeneration : true;
        const matchesShiny = isShiny && showShadow ? pokemon.shiny_available === 1 && pokemon.shadow_shiny_available === 1 : (isShiny ? pokemon.shiny_available === 1 : true);
        const isGenerationSearch = generations.some(gen => gen.toLowerCase() === searchTerm.toLowerCase());
        const matchesSearch = !isGenerationSearch && pokemon.name && typeof pokemon.name === 'string' ? pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        
        const basicMatches = matchesGeneration && matchesShiny && matchesSearch;
    
        if (costume) {
            return (
                !isShiny && !showShadow ||
                (isShiny && !showShadow && costume.shiny_available === 1) ||
                (!isShiny && showShadow && costume.shadow_available === 1) ||
                (isShiny && showShadow && costume.shiny_available === 1 && costume.shiny_shadow_available === 1)
            ) && basicMatches; // Combine the costume conditions with basicMatches
        } else {
            return basicMatches;
        }
    }
    
    const generations = [
        "Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Hisui", "Paldea"
    ];

    useEffect(() => {
        axios.get('http://localhost:3000/api/pokemons')
            .then(response => {
                console.log("API Response: ", response.data);
                setAllPokemons(response.data);
                setDisplayedPokemons(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching the Pokémon data: ", error);
                setLoading(false);
            });
    }, []);

    const [showCostume, setShowCostume] = useState(false); // 1. Add new state for costume toggle
    
    useEffect(() => {
        const filteredPokemons = allPokemons.reduce((acc, pokemon) => {
            const shadowCostumes = [20, 33, 143, 403];
        
            if (!singleFormPokedexNumbers.includes(pokemon.pokedex_number) || !acc.some(p => p.pokedex_number === pokemon.pokedex_number)) {
                if (showCostume && pokemon.costumes) {
                    pokemon.costumes.forEach(costume => {
                        if (shouldAddPokemon(pokemon, costume)) {
                            const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow, costume);
                            acc.push({ 
                                ...pokemon, 
                                currentImage: imageToUse,
                                currentCostumeName: costume.name 
                            });
                        }
                    });
                } else {
                    if (shouldAddPokemon(pokemon, null)) {
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

    function formatForm(form) {
        if (!form) return "";
    
        const words = form
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    
        // If there are only 2 words, just return as they are already capitalized
        if (words.length === 2) {
            return words.join(' ');
        }
    
        return words.join(' ');
    }
     
    return (
        <div>
            <div className="header">
                <div className="header-section browse-section">
                    <h1>Browse</h1>
                    <input 
                        type="text" 
                        placeholder="Search..."
                        value={searchTerm} 
                        onChange={(e) => {
                            const term = e.target.value;  // Don't convert to lowercase here
                            setSearchTerm(term);

                            // Convert to lowercase only when doing the comparison
                            const matchedGeneration = generations.find(gen => gen.toLowerCase() === term.toLowerCase()); 
                            
                            setSelectedGeneration(prevState => {
                                const newGeneration = matchedGeneration ? generations.indexOf(matchedGeneration) + 1 : null;
                                return newGeneration;
                            });
                        }}
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
