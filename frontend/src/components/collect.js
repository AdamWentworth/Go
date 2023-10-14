import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './collect.css';

function Collect() {
    const [pokemons, setPokemons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Define fetchPokemons outside of useEffect
    const fetchPokemons = (name) => {
        setLoading(true);
        axios.get('http://localhost:3000/api/pokemons', { params: { name } })
            .then(response => {
                setPokemons(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching the Pokémon data: ", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        // Fetch Pokémons on mount without search term
        fetchPokemons();
    }, []); // Empty dependency array means this useEffect runs once on mount

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Fetch Pokémons on 'Enter' key press
            fetchPokemons(searchTerm);
        }
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
                    onKeyDown={handleKeyDown}
                />
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="pokemon-container">
                    {pokemons.map(pokemon => (
                        <div key={pokemon.pokemon_id} className="pokemon-card">
                            <img src={pokemon.image} alt={pokemon.pokemon_name} />
                            <h2>{pokemon.name}</h2>
                            {/* ... any additional Pokémon details you want to display ... */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Collect;
