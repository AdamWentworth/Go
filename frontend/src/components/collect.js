import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './collect.css'; 

function Collect() {
    const [pokemons, setPokemons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://localhost:3000/api/pokemons')
            .then(response => {
                setPokemons(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching the Pokémon data: ", error);
                setLoading(false);
            });
    }, []);

    // Specify Pokédex numbers to display only the first form
    const singleFormPokedexNumbers = [585, 586, 649, 664, 665, 666, 669, 670, 671, 676, 710, 711, 741];

    // Function to filter Pokémon and handle different forms
    const filterPokemons = (pokemons) => {
        return pokemons.reduce((acc, pokemon) => {
            // If the Pokémon's Pokédex number is one of those to have a single form displayed,
            // check if it's already in the accumulator array. If it is, skip it.
            if (singleFormPokedexNumbers.includes(pokemon.pokedex_number)) {
                if (acc.some(p => p.pokedex_number === pokemon.pokedex_number)) {
                    return acc;
                }
            }
            // Ensure Pokémon has an image before adding to array
            if (pokemon.image) {
                acc.push(pokemon);
            }
            return acc;
        }, []);
    };

    const filteredPokemons = filterPokemons(pokemons);

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
                            {/* ... other Pokémon details ... */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Collect;
