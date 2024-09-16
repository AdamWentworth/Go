// validatePokemon.js

const validatePokemon = (pokemonData, name, shinyChecked, shadowChecked, selectedCostume, form) => {
  // Find exact match for the Pokémon name and form
  const matchedPokemon = pokemonData.find(
    (variant) => variant.name.toLowerCase() === name.toLowerCase() && (form ? variant.form === form : true)
  );

  if (!matchedPokemon) {
    return { error: `No exact match found for Pokémon "${name}" with form "${form}".`, availableCostumes: [], availableForms: [] };
  }

  if (shinyChecked && !matchedPokemon.shiny_available) {
    return { error: `Shiny variant not available for "${name}".`, availableCostumes: [], availableForms: [] };
  }

  if (shadowChecked && !matchedPokemon.date_shadow_available) {
    return { error: `Shadow variant not available for "${name}".`, availableCostumes: [], availableForms: [] };
  }

  // Check shadow shiny availability if both are selected
  if (shinyChecked && shadowChecked && !matchedPokemon.shadow_shiny_available) {
    return { error: `Shiny shadow variant not available for "${name}".`, availableCostumes: [], availableForms: [] };
  }

  // Validate the selected costume with shiny and shadow conditions
  if (selectedCostume) {
    const selectedCostumeData = matchedPokemon.costumes.find((costume) => costume.name === selectedCostume);

    if (selectedCostumeData) {
      if (shinyChecked && shadowChecked && !selectedCostumeData.image_url_shiny_shadow) {
        return { error: `No shiny shadow variant available for the costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes, availableForms: [] };
      }
      if (shinyChecked && !selectedCostumeData.image_url_shiny) {
        return { error: `No shiny variant available for the costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes, availableForms: [] };
      }
      if (shadowChecked && !selectedCostumeData.image_url_shadow) {
        return { error: `No shadow variant available for the costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes, availableForms: [] };
      }
    }
  }

  const availableForms = pokemonData
    .filter((variant) => variant.name.toLowerCase() === name.toLowerCase())
    .map((variant) => variant.form);

  const availableCostumes = matchedPokemon.costumes || [];
  return { error: null, availableCostumes, availableForms };
};

export default validatePokemon;