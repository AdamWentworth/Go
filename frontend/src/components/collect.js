import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './collect.css';

function Collect() {
    const [allPokemons, setAllPokemons] = useState([]);
    const [displayedPokemons, setDisplayedPokemons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isShiny, setIsShiny] = useState(false);
    const [selectedGeneration, setSelectedGeneration] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const singleFormPokedexNumbers = [649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741]; // Add specific numbers as per your requirement.

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
            const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
            const basicMatches = matchesGeneration && matchesShiny && matchesSearch;

            // If Pokémon is in the list where we want to show only one form and multiple forms already exist, keep only the first one.
            if (singleFormPokedexNumbers.includes(pokemon.pokedex_number) && acc.some(p => p.pokedex_number === pokemon.pokedex_number)) {
                return acc;
            }
    
            // If showCostume is active, create entries for all costumes
            if (showCostume && basicMatches) {
                pokemon.costumes.forEach(costume => {
                    acc.push({ ...pokemon, currentImage: isShiny ? costume.shiny_image : costume.image });
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

    return (
        <div>
            <div className="header">
                <h1>Collect Page</h1>
                <input 
                    type="text" 
                    placeholder="Search..."
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={toggleShiny} className={`shiny-button ${isShiny ? 'active' : ''}`}>
                    <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
                    {isShiny ? "Show Regular" : "Show Shiny"}
                </button>
                <div className="generation-buttons">
                    {generations.map((gen, index) => (
                        <button 
                            key={gen}
                            onClick={() => setSelectedGeneration(index + 1)} 
                            className={selectedGeneration === index + 1 ? 'active' : ''}
                        >
                            {gen}
                        </button>
                    ))}
                </div>
                <button onClick={toggleCostume} className={`costume-button ${showCostume ? 'active' : ''}`}> 
                    {/* New costume button */}
                    {showCostume ? "Hide Costumes" : "Show Costumes"}
                </button>
            </div>

            <div className="pokemon-container">
            {loading ? (
                <p>Loading...</p>
            ) : (
                displayedPokemons.map((pokemon, index) => (
                    <div key={index} className="pokemon-card">  {/* changed key to index since pokemon ID is not unique */}
                        <img src={pokemon.currentImage} alt={pokemon.name} />
                        <h2>{pokemon.name}</h2>
                    </div>
                ))                    
            )}
            </div>
        </div>
    );
}

export default Collect;
