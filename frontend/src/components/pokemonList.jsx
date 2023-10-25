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
            const matchesGeneration = selectedGeneration ? pokemon.generation === selectedGeneration : true;
            const matchesShiny = isShiny ? pokemon.shiny_available === 1 : true;
            const isGenerationSearch = generations.some(gen => gen.toLowerCase() === searchTerm.toLowerCase());
            const matchesSearch = !isGenerationSearch && pokemon.name && typeof pokemon.name === 'string' ? pokemon.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
            const basicMatches = matchesGeneration && matchesShiny && matchesSearch;
            const alreadyAddedPokemonIds = new Set([]);
    
            if (singleFormPokedexNumbers.includes(pokemon.pokedex_number) && acc.some(p => p.pokedex_number === pokemon.pokedex_number)) {
                return acc;
            }
        
            if (showCostume && basicMatches) {
                pokemon.costumes.forEach(costume => {
                    // Check if the costume's shiny variant is available when shiny toggle is on
                    if (!isShiny || (isShiny && costume.shiny_available === 1)) {
                        let costumeImageToUse = costume.image;
                        if (isShiny && showShadow) {
                            costumeImageToUse = costume.shiny_shadow_image; // Assuming you have a shiny shadow image for costumes
                        } else if (isShiny) {
                            costumeImageToUse = costume.shiny_image;
                        } else if (showShadow) {
                            costumeImageToUse = costume.shadow_image; // Assuming you have a shadow image for costumes
                        }
                        acc.push({ 
                            ...pokemon, 
                            currentImage: costumeImageToUse,
                            currentCostumeName: costume.name 
                        });
                    }
                });
            }
                           
            // Otherwise, just add the pokemon as is, if not added yet
            else if (basicMatches && !alreadyAddedPokemonIds.has(pokemon.pokemon_id)) {
                alreadyAddedPokemonIds.add(pokemon.pokemon_id);
                let imageToUse = pokemon.image;
                if (isShiny && showShadow) {
                    imageToUse = pokemon.shiny_shadow_image;
                } else if (isShiny) {
                    imageToUse = pokemon.shiny_image;
                } else if (showShadow) {
                    imageToUse = pokemon.shadow_image;
                }
                acc.push({ ...pokemon, currentImage: imageToUse });
            }              
            // Otherwise, just add the pokemon as is
            else if (basicMatches) {
                let imageToUse = pokemon.image;
                if (isShiny && showShadow) {
                    imageToUse = pokemon.shiny_shadow_image;
                } else if (isShiny) {
                    imageToUse = pokemon.shiny_image;
                } else if (showShadow) {
                    imageToUse = pokemon.shadow_image;
                }
                acc.push({ ...pokemon, currentImage: imageToUse });
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
        if (showShadow && !pokemon.shadow_image) {
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
