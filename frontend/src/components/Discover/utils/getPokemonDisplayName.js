// getPokemonDisplayName.js

import { formatCostumeName, formatForm } from "../../Collect/utils/formattingHelpers";

// Utility function to capitalize the first letter of each word
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const getPokemonDisplayName = (item) => {
  let displayName = '';

  // Determine if the Pokémon is shiny, shadow, or both
  if (item.shiny && item.shadow) {
    displayName += 'Shiny Shadow ';
  } else if (item.shiny) {
    displayName += 'Shiny ';
  } else if (item.shadow) {
    displayName += 'Shadow ';
  }

  // Include form if it exists (e.g., "Alolan") and use formatForm to format it
  if (item.pokemonInfo.form) {
    displayName += `${formatForm(item.pokemonInfo.form)} `; // Use formatForm for the form name
  }

  // Include costume if it exists (e.g., "Party Hat") and capitalize it
  if (item.costume_id) {
    const costumeName = item.pokemonInfo.costumes?.find(costume => costume.costume_id === item.costume_id)?.name;
    if (costumeName) {
      displayName += `${formatCostumeName(costumeName)} `; // Use formatCostumeName for the costume
    }
  }

  // Finally, add the Pokémon's base name and capitalize it
  displayName += capitalizeFirstLetter(item.pokemonInfo.name);

  // Return the final display name
  const trimmedName = displayName.trim();

  return trimmedName; // Trim any extra spaces
};

export default getPokemonDisplayName;
