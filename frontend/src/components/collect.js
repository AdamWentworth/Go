import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './collect.css'; // Import CSS file for styling

function Collect() {
    const [pokemons, setPokemons] = useState([]); // Store the fetched Pokémon data
    const [loading, setLoading] = useState(true); // Loading state

    useEffect(() => {
        // Fetch Pokémon data when the component mounts
        axios.get('http://localhost:3000/api/pokemons')
            .then(response => {
                setPokemons(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching the Pokémon data: ", error);
                setLoading(false);
            });
    }, []); // The empty dependency array means this useEffect runs once when the component mounts

    // Filter out Pokémon without images
    const filteredPokemons = pokemons.filter(pokemon => pokemon.image);

    return (
        <div>
            <h1>Collect Page</h1>
            
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="pokemon-container">
                    {filteredPokemons.map(pokemon => (
                        <div key={pokemon.pokemon_id} className="pokemon-card">
                            <img src={pokemon.image} alt={pokemon.name} />
                            <h2>{pokemon.name}</h2>
                            {/* ... any other Pokémon details you want to display ... */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Collect;
