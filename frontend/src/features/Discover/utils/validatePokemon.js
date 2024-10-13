// validatePokemon.js

const validatePokemon = (pokemonData, name, shinyChecked, shadowChecked, selectedCostume, form) => {
  // console.log("Starting validation for:", name, "with form:", form);

  const matchedPokemon = pokemonData.find(
    (variant) => variant.name.toLowerCase() === name.toLowerCase() && (form ? variant.form === form : true)
  );

  if (!matchedPokemon) {
    // console.log("No matched Pokémon found for:", name);
    return { error: `No match found for Pokémon "${name}" with form "${form}".`, availableCostumes: [], availableForms: [] };
  }

  // console.log("Matched Pokémon:", matchedPokemon);

  if (shinyChecked && !matchedPokemon.shiny_available) {
    // console.log("Shiny not available for:", name);
    return { error: `Shiny variant not available for "${name}".`, availableCostumes: [], availableForms: [] };
  }

  if (shadowChecked && !matchedPokemon.date_shadow_available) {
    // console.log("Shadow not available for:", name);
    return { error: `Shadow variant not available for "${name}".`, availableCostumes: [], availableForms: [] };
  }

  if (shinyChecked && shadowChecked && !matchedPokemon.shadow_shiny_available) {
    // console.log("Shiny shadow not available for:", name);
    return { error: `Shiny shadow variant not available for "${name}".`, availableCostumes: [], availableForms: [] };
  }

  // Initialize availableForms before using it.
  const availableForms = pokemonData
    .filter((variant) => variant.name.toLowerCase() === name.toLowerCase())
    .map((variant) => variant.form);

  const availableCostumes = matchedPokemon.costumes || [];

  // If no costume is selected or it's set to 'None', skip the costume validation.
  if (!selectedCostume || selectedCostume === 'None') {
    // console.log("No costume selected or costume set to 'None'.");
    return { error: null, availableCostumes: availableCostumes, availableForms: availableForms };
  }

  const selectedCostumeData = matchedPokemon.costumes.find((costume) => costume.name === selectedCostume);

  if (!selectedCostumeData) {
    // console.log("Costume not found:", selectedCostume);
    return { error: `Costume "${selectedCostume}" not found.`, availableCostumes: matchedPokemon.costumes, availableForms: [] };
  }

  // console.log("Costume data found:", selectedCostumeData);

  if (shinyChecked && shadowChecked) {
    // console.log("Checking for shiny shadow costume.");
    if (selectedCostumeData.shadow_costume) {
      // console.log("Shadow costume key exists:", selectedCostumeData.shadow_costume);
      if (!selectedCostumeData.shadow_costume.image_url_shadow_costume) {
        // console.log("Image URL for shadow costume not available.");
        return { error: `No image available for shiny shadow costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes, availableForms: [] };
      }
    } else {
      // console.log("Shadow costume variant not available.");
      return { error: `Shadow costume variant not available for "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes, availableForms: [] };
    }
  }

  if (shinyChecked && !selectedCostumeData.image_url_shiny) {
    // console.log("Shiny image URL not available.");
    return { error: `No shiny variant available for the costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes, availableForms: [] };
  }
  if (shadowChecked && !selectedCostumeData.shadow_costume) {
    // console.log("Shadow costume key does not exist.");
    return { error: `No shadow variant available for the costume "${selectedCostume}".`, availableCostumes: matchedPokemon.costumes, availableForms: [] };
  }

  // console.log("Available forms and costumes determined.");
  return { error: null, availableCostumes, availableForms };
};

export default validatePokemon;