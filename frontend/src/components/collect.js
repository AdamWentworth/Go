import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './collect.css';
import PokemonOverlay from './pokemonOverlay'; 

function Collect() {
    // console.log("Collect component rendered");
    const [allPokemons, setAllPokemons] = useState([]);
    const [displayedPokemons, setDisplayedPokemons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isShiny, setIsShiny] = useState(false);
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
    
            if (singleFormPokedexNumbers.includes(pokemon.pokedex_number) && acc.some(p => p.pokedex_number === pokemon.pokedex_number)) {
                return acc;
            }
        
            if (showCostume && basicMatches) {
                pokemon.costumes.forEach(costume => {
                    // Check if the costume's shiny variant is available when shiny toggle is on
                    if (!isShiny || (isShiny && costume.shiny_available === 1)) {
                        acc.push({ 
                            ...pokemon, 
                            currentImage: isShiny ? costume.shiny_image : costume.image, 
                            currentCostumeName: costume.name 
                        });
                    }
                });
            }
            // Otherwise, add the Pokemon itself (without costumes)
            else if (basicMatches) {
                acc.push({ ...pokemon, currentImage: isShiny ? pokemon.shiny_image : pokemon.image });
            }
        
            return acc;
        }, []);
        
        setDisplayedPokemons(filteredPokemons);
    }, [selectedGeneration, isShiny, allPokemons, searchTerm, showCostume]);    
    
    const toggleShiny = () => {
        setIsShiny(prevState => !prevState);
    };

    const toggleCostume = () => { // 2. Toggle function for costume state
        setShowCostume(prevState => !prevState);
    };

    function formatForm(form) {
        if (!form) return "";
    
        return form
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
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
                        {isShiny ? "Show Regular" : "Show Shiny"}
                    </button>
                    <button onClick={toggleCostume} className={`shiny-button ${showCostume ? 'active' : ''}`}>
                        <img src="/images/costume_icon.png" alt="Toggle Costume" />
                        {showCostume ? "Hide Costumes" : "Show Costumes"}
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
                        {displayedPokemons.map((pokemon, index) => (
                            <div className="pokemon-card" 
                                key={`${pokemon.pokemon_id}-${pokemon.currentCostumeName || 'default'}`} 
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
                        ))}
                        {selectedPokemon && <PokemonOverlay pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />}
                    </>
                )}
            </div>
        </div>
    );
}

export default Collect;
