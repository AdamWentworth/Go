import React, { useEffect, useState } from 'react';

const PokemonList = () => {
    const [pokemon, setPokemon] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/pokemon')
            .then(response => response.json())
            .then(data => setPokemon(data))
            .catch(error => console.error('Error fetching data: ', error));
    }, []);

    return (
        <div>
            <h1>Pokemon List</h1>
            {/* Code to render pokemon data goes here */}
        </div>
    );
};

export default PokemonList;
