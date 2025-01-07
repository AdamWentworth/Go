// EvolutionShortcut.jsx

import React from 'react';
import './EvolutionShortcut.css';

const EvolutionShortcut = ({ 
  evolvesFrom, 
  evolvesTo, 
  megaEvolutions, 
  allPokemonData, 
  setSelectedPokemon, 
  currentPokemon 
}) => {

  // Function to extract the base name by slicing off everything before the last space
  const getBaseName = (name) => {
    return name.substring(name.lastIndexOf(' ') + 1);
  };

  function getPokemonNameById(id) {
    const pokemon = allPokemonData.find(
      (p) => p.pokemon_id === id && p.variantType === 'default'
    );
    return pokemon ? getBaseName(pokemon.name) : 'Unknown Pokemon';
  }

  const onEvolutionClick = (pokemonId, form) => {
    // If `form` is undefined, we assume this is a normal evolution → look for 'default'
    if (form === undefined) {
      const selectedPokemonData = allPokemonData.find(
        (p) => p.pokemon_id === pokemonId && p.variantType === 'default'
      );
      if (selectedPokemonData) {
        setSelectedPokemon(selectedPokemonData);
      } else {
        console.warn(
          '[onEvolutionClick] No matching Pokémon found for ID', 
          pokemonId, 
          'variantType: default'
        );
      }
    } else {
      // Otherwise, we assume it is a Mega evolution
      let variantTypes = ['mega'];

      if (form?.toUpperCase() === 'X') {
        variantTypes.push('mega_x');
      } else if (form?.toUpperCase() === 'Y') {
        variantTypes.push('mega_y');
      }

      const selectedPokemonData = allPokemonData.find(
        (p) => p.pokemon_id === pokemonId && variantTypes.includes(p.variantType)
      );

      if (selectedPokemonData) {
        setSelectedPokemon(selectedPokemonData);
      } else {
        console.warn(
          '[onEvolutionClick] No matching Pokémon found for ID', 
          pokemonId, 
          'and variantTypes:', 
          variantTypes
        );
      }
    }
  };

  const onRevertToBaseClick = (pokemonId) => {
    const baseForm = allPokemonData.find(
      (p) => p.pokemon_id === pokemonId && p.variantType === 'default'
    );
    if (baseForm) {
      setSelectedPokemon(baseForm);
    } else {
      console.warn(
        '[onRevertToBaseClick] No base form found for Pokémon ID:', pokemonId
      );
    }
  };

  const isCurrentMega = currentPokemon?.variantType?.includes('mega');

  return (
    <div className="evolution-shortcut">
      {/* Evolves from */}
      {!isCurrentMega && Array.isArray(evolvesFrom) && evolvesFrom.length > 0 && (
        <div className="evolution-list evolves-from">
          {evolvesFrom.map((preEvolutionPokemonId) => (
            <div
              key={preEvolutionPokemonId}
              className="evolution-item"
              onClick={() => onEvolutionClick(preEvolutionPokemonId)}
            >
              <img 
                src={`/images/default/pokemon_${preEvolutionPokemonId}.png`} 
                alt={getPokemonNameById(preEvolutionPokemonId)} 
              />
              <span>{getPokemonNameById(preEvolutionPokemonId)}</span>
            </div>
          ))}
        </div>
      )}
  
      {/* Evolves to */}
      {!isCurrentMega && Array.isArray(evolvesTo) && evolvesTo.length > 0 && (
        <div className="evolution-list evolves-to">
          {evolvesTo.map((evolutionPokemonId) => (
            <div
              key={evolutionPokemonId}
              className="evolution-item"
              onClick={() => onEvolutionClick(evolutionPokemonId)}
            >
              <img 
                src={`/images/default/pokemon_${evolutionPokemonId}.png`} 
                alt={getPokemonNameById(evolutionPokemonId)} 
              />
              <span>{getPokemonNameById(evolutionPokemonId)}</span>
            </div>
          ))}
        </div>
      )}
  
      {/* Mega evolution section (hidden if current Pokémon is Mega) */}
      {!isCurrentMega && Array.isArray(megaEvolutions) && megaEvolutions.length > 0 && (
        <div className="evolution-list evolves-to mega-evolutions">
          {megaEvolutions.map((mega) => (
            <div
              key={mega.id}
              className="evolution-item"
              onClick={() => onEvolutionClick(currentPokemon.pokemon_id, mega.form)}
            >
              <img
                src={
                  mega.image_url 
                    ? mega.image_url 
                    : `/images/default/pokemon_${mega.id}.png`
                }
                alt={`Mega ${currentPokemon.name}${mega.form ? ` ${mega.form}` : ''}`}
              />
              <span>
                Mega {currentPokemon.name}{mega.form ? ` ${mega.form}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
  
      {/* Revert to base form */}
      {isCurrentMega && (
        <div className="evolution-list revert-to-base">
          <div
            className="evolution-item"
            onClick={() => onRevertToBaseClick(currentPokemon.pokemon_id)}
          >
            <img 
              src={`/images/default/pokemon_${currentPokemon.pokemon_id}.png`} 
              alt={`${getPokemonNameById(currentPokemon.pokemon_id)}`} 
            />
            <span>{getPokemonNameById(currentPokemon.pokemon_id)}</span>
          </div>
        </div>
      )}
    </div>
  );  
};

export default EvolutionShortcut;
