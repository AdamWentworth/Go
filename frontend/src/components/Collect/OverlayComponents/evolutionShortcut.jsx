// EvolutionShortcut.jsx

import React from 'react';
import './evolutionShortcut.css';

const EvolutionShortcut = ({ evolvesFrom, evolvesTo, allPokemonData, setSelectedPokemon }) => {

  function getPokemonNameById(id) {
    const pokemon = allPokemonData.find(p => p.pokemon_id === id);
    return pokemon ? pokemon.name : 'Unknown Pokemon';
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
              <img src={`/images/default/pokemon_${preEvolutionPokemonId}.png`} alt="Pre-evolution" />
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
              <img src={`/images/default/pokemon_${evolutionPokemonId}.png`} alt="Evolution" />
              <span>{getPokemonNameById(evolutionPokemonId)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default EvolutionShortcut;
