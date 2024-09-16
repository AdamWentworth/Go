// validatePokemon.js

const validatePokemon = (pokemonData, name, shinyChecked, shadowChecked, selectedCostume) => {
  // Find exact match for the Pokémon name
  const matchedPokemon = pokemonData.find(
    (variant) => variant.name.toLowerCase() === name.toLowerCase()
  );

  if (!matchedPokemon) {
    return { error: `No exact match found for Pokémon "${name}".`, availableCostumes: [] };
  }

  if (shinyChecked && !matchedPokemon.shiny_available) {
    return { error: `Shiny variant not available for "${name}".`, availableCostumes: [] };
  }

  if (shadowChecked && !matchedPokemon.date_shadow_available) {
    return { error: `Shadow variant not available for "${name}".`, availableCostumes: [] };
  }

  // Check shadow shiny availability if both are selected
  if (shinyChecked && shadowChecked && !matchedPokemon.shadow_shiny_available) {
    return { error: `Shiny shadow variant not available for "${name}".`, availableCostumes: [] };
  }

  // Validate the selected costume with shiny and shadow conditions
  if (selectedCostume) {
    const selectedCostumeData = matchedPokemon.costumes.find((costume) => costume.name === selectedCostume);

    if (selectedCostumeData) {
      if (shinyChecked && shadowChecked && !selectedCostumeData.image_url_shiny_shadow) {
        return { error: `No shiny shadow variant available for the costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes };
      }
      if (shinyChecked && !selectedCostumeData.image_url_shiny) {
        return { error: `No shiny variant available for the costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes };
      }
      if (shadowChecked && !selectedCostumeData.image_url_shadow) {
        return { error: `No shadow variant available for the costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes };
      }
    }
  }

  const availableCostumes = matchedPokemon.costumes || [];
  return { error: null, availableCostumes };
};

export default validatePokemon;