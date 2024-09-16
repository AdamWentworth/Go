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
          if (shinyChecked) {
            url = selectedCostumeData.image_url_shiny || selectedCostumeData.image_url;
          } else if (shadowChecked) {
            url = selectedCostumeData.image_url_shadow || selectedCostumeData.image_url;
          } else {
            url = selectedCostumeData.image_url;
          }
        }
      }
      return url;
    }
    return null;
  };
  