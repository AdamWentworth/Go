/* shinyInfo.jsx */
import React from 'react';
import './shinyInfo.css';
import { formatShinyRarity, getLastWord } from '../utils/formattingHelpers';

function ShinyInfo({ pokemon, allPokemonData }) {
  // Helper function to find previous evolution's name and ID if needed
  const getPreviousEvolution = () => {
    if (pokemon.evolves_from) {
      const previousEvolution = allPokemonData.find(p => p.pokemon_id === pokemon.evolves_from[0]);
      return previousEvolution ? previousEvolution : null;
    }
    return null;
  };

  // Function to determine what text to display for shiny rarity
  const displayShinyRarity = () => {
    const defaultShinyRarity = formatShinyRarity(pokemon.shiny_rarity);
    const previousEvolution = getPreviousEvolution();

    if (defaultShinyRarity === 'Full Odds ~1/500') {
      if (pokemon.evolves_from && previousEvolution) {
        // Check if the current Pokémon's ID is greater than its previous evolution's ID
        if (pokemon.pokemon_id < previousEvolution.pokemon_id) {
          return defaultShinyRarity;  // Use default rarity otherwise
        } else {
          return `Evolve ${getLastWord(previousEvolution.name)}`; // Suggest evolution if the current Pokémon ID is less
        }
      }
      return defaultShinyRarity;  // Return the default shiny rarity if there's no previous evolution or other conditions aren't met
    }
    return defaultShinyRarity;  // Return directly the formatted rarity if not 'Full Odds ~1/500'
  }

  return (
    <div className="column shiny-info-column">
      <h1>Shiny Info</h1>
      <img src={pokemon.image_url_shiny} alt={`${pokemon.name} Shiny`} />
      <div>
        <strong>Shiny Rarity:</strong> {displayShinyRarity()}
      </div>
    </div>
  );
}

export default ShinyInfo;



