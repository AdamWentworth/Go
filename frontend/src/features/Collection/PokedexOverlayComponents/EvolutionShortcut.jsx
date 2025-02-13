// EvolutionShortcut.jsx

import React from 'react';
import './EvolutionShortcut.css';

const EvolutionShortcut = ({ 
  evolvesFrom, 
  evolvesTo, 
  megaEvolutions,
  fusionEvolutions,
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

  const onFusionClick = (fusion) => {
    // Construct the expected variant type for the fusion
    const fusionVariantType = `fusion_${fusion.fusion_id}`;
  
    // Search for the Pokémon variant matching the fusion_id and variant type
    const selectedPokemonData = allPokemonData.find(
      (p) =>
        p.pokemon_id === fusion.base_pokemon_id1 &&
        p.variantType === fusionVariantType
    );
  
    if (selectedPokemonData) {
      // Embed fusion details into the selected Pokémon object
      setSelectedPokemon({ 
        ...selectedPokemonData, 
        fusionInfo: fusion 
      });
    } else {
      console.warn(
        '[onFusionClick] No matching Pokémon found for fusion', 
        fusion.fusion_id
      );
    }
  };  

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
      // Handle both Mega and Primal forms here
      let variantTypes = [];
      if(form === 'primal') {
        variantTypes.push('primal');
      } else {
        variantTypes.push('mega');
        if(form?.toUpperCase() === 'X') {
          variantTypes.push('mega_x');
        } else if(form?.toUpperCase() === 'Y') {
          variantTypes.push('mega_y');
        }
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
  const isCurrentPrimal = currentPokemon?.variantType?.includes('primal');
  const isCurrentFusion = currentPokemon?.variantType?.startsWith('fusion');
  let computedFusionInfo = currentPokemon.fusionInfo;
  if (isCurrentFusion && !computedFusionInfo) {
    const fusionId = currentPokemon.variantType.split('_')[1];
    // Find the matching fusion details from fusionEvolutions
    computedFusionInfo = fusionEvolutions?.find(
      (fusion) => fusion.fusion_id.toString() === fusionId
    );
  }

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
  
      {/* Mega/Primal evolution section (hidden if current Pokémon is Mega) */}
      {!(isCurrentMega || isCurrentPrimal) && Array.isArray(megaEvolutions) && megaEvolutions.length > 0 && (
        <div className="evolution-list evolves-to mega-evolutions">
          {megaEvolutions.map((mega) => {
            // Use truthiness to determine if this evolution is Primal
            const isPrimal = !!mega.primal; 
            const titlePrefix = isPrimal ? 'Primal' : 'Mega';

            return (
              <div
                key={mega.id}
                className="evolution-item"
                onClick={() => 
                  onEvolutionClick(
                    currentPokemon.pokemon_id, 
                    isPrimal ? 'primal' : mega.form
                  )
                }
              >
                <img
                  src={
                    mega.image_url 
                      ? mega.image_url 
                      : `/images/default/pokemon_${mega.id}.png`
                  }
                  alt={`${titlePrefix} ${currentPokemon.name}${mega.form ? ` ${mega.form}` : ''}`}
                />
                <span>
                  {titlePrefix} {currentPokemon.name}{mega.form ? ` ${mega.form}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Fusion Evolutions Section */}
      {!(isCurrentFusion) && Array.isArray(fusionEvolutions) && fusionEvolutions.length > 0 && (
        <div className="evolution-list fusion-evolutions">
          {fusionEvolutions.map((fusion) => (
            <div
              key={fusion.fusion_id}
              className="evolution-item"
              onClick={() => onFusionClick(fusion)}
            >
              <img
                src={
                  fusion.image_url 
                    ? fusion.image_url 
                    : `/images/default/pokemon_${fusion.base_pokemon_id1}_${fusion.base_pokemon_id2}.png`
                }
                alt={fusion.name}
              />
              <span>{fusion.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Revert to base form */}
      {(isCurrentMega || isCurrentPrimal || isCurrentFusion) && (
        <div className="evolution-list revert-to-base">
          {isCurrentFusion ? (
            <>
              {/* Revert option for primary base form */}
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
              {/* Revert option for secondary base form */}
              {computedFusionInfo?.base_pokemon_id2 && (
                <div
                  className="evolution-item"
                  onClick={() => onRevertToBaseClick(computedFusionInfo.base_pokemon_id2)}
                >
                  <img 
                    src={`/images/default/pokemon_${computedFusionInfo.base_pokemon_id2}.png`} 
                    alt={`${getPokemonNameById(computedFusionInfo.base_pokemon_id2)}`} 
                  />
                  <span>{getPokemonNameById(computedFusionInfo.base_pokemon_id2)}</span>
                </div>
              )}
            </>
          ) : (
            // Fallback for Mega/Primal cases
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
          )}
        </div>
      )}
    </div>
  );  
};

export default EvolutionShortcut;
