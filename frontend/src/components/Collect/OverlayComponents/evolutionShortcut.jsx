// EvolutionShortcut.jsx

import React from 'react';
import './evolutionShortcut.css';

const EvolutionShortcut = ({ evolvesFrom, evolvesTo, allPokemonData, setSelectedPokemon }) => {
  
  // Function to extract the base name by slicing off everything before the last space
  const getBaseName = (name) => {
    return name.substring(name.lastIndexOf(' ') + 1);
  };

  function getPokemonNameById(id) {
    const pokemon = allPokemonData.find(p => p.pokemon_id === id);
    return pokemon ? getBaseName(pokemon.name) : 'Unknown Pokemon'; // Apply getBaseName here
  }

  const onEvolutionClick = (pokemonId) => {
    const selectedPokemonData = allPokemonData.find(p => p.pokemon_id === pokemonId);
    if (selectedPokemonData) {
      setSelectedPokemon(selectedPokemonData); // This should work for both evolves_from and evolves_to
    }
  };  

  return (
    <div className="evolution-shortcut">
      {Array.isArray(evolvesFrom) && evolvesFrom.length > 0 && (
        <div className="evolution-list evolves-from">
          {evolvesFrom.map((preEvolutionPokemonId) => (
            <div
              key={preEvolutionPokemonId}
              className="evolution-item"
              onClick={() => onEvolutionClick(preEvolutionPokemonId)}
            >
              <img src={`/images/default/pokemon_${preEvolutionPokemonId}.png`} alt={getPokemonNameById(preEvolutionPokemonId)} />
              <span>{getPokemonNameById(preEvolutionPokemonId)}</span>
            </div>
          ))}
        </div>
      )}

      {evolvesTo && evolvesTo.length > 0 && (
        <div className="evolution-list evolves-to">
          {evolvesTo.map((evolutionPokemonId) => (
            <div
              key={evolutionPokemonId}
              className="evolution-item"
              onClick={() => onEvolutionClick(evolutionPokemonId)}
            >
              <img src={`/images/default/pokemon_${evolutionPokemonId}.png`} alt={getPokemonNameById(evolutionPokemonId)} />
              <span>{getPokemonNameById(evolutionPokemonId)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvolutionShortcut;
