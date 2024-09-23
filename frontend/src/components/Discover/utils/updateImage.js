// utils/updateImage.js

export const updateImage = (pokemonData, name, shinyChecked, shadowChecked, selectedCostume, form) => {
  const matchedPokemon = pokemonData.find(
    (variant) => variant.name.toLowerCase() === name.toLowerCase() && (form ? variant.form === form : true)
  );

  if (matchedPokemon) {
    let url = matchedPokemon.image_url;

    // Handle both shiny and shadow selected
    if (shinyChecked && shadowChecked) {
      if (matchedPokemon.shadow_shiny_available) {
        url = matchedPokemon.image_url_shiny_shadow || matchedPokemon.image_url_shiny;
      } else {
        url = matchedPokemon.image_url_shadow;
      }
    } else if (shinyChecked) {
      url = matchedPokemon.image_url_shiny;
    } else if (shadowChecked) {
      url = matchedPokemon.image_url_shadow;
    }

    // Handle costume selection
    if (selectedCostume && selectedCostume !== "") {
      const selectedCostumeData = matchedPokemon.costumes.find((costume) => costume.name === selectedCostume);
      if (selectedCostumeData) {
        // Check for shiny and shadow costume availability
        if (shinyChecked && shadowChecked) {
          if (selectedCostumeData.shadow_costume && selectedCostumeData.shadow_costume.image_url_shiny_shadow_costume) {
            url = selectedCostumeData.shadow_costume.image_url_shiny_shadow_costume;
          } else if (selectedCostumeData.image_url_shiny) {
            url = selectedCostumeData.image_url_shiny;
          }
        } else if (shadowChecked) {
          if (selectedCostumeData.shadow_costume && selectedCostumeData.shadow_costume.image_url_shadow_costume) {
            url = selectedCostumeData.shadow_costume.image_url_shadow_costume;
          } else {
            url = selectedCostumeData.image_url_shadow || selectedCostumeData.image_url;
          }
        } else if (shinyChecked) {
          url = selectedCostumeData.image_url_shiny || selectedCostumeData.image_url;
        } else {
          url = selectedCostumeData.image_url;
        }
      }
    }
    return url;
  }
  return null;
};