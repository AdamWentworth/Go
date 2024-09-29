// utils/updateImage.js

export const updateImage = (pokemonData, name, shinyChecked, shadowChecked, selectedCostume, form, selectedGender) => {
  const matchedPokemon = pokemonData.find(
    (variant) => variant.name.toLowerCase() === name.toLowerCase() && (form ? variant.form === form : true)
  );

  if (matchedPokemon) {
    let url = matchedPokemon.image_url;
    
    // Debugging Statements
    console.log("Matched Pokemon:", matchedPokemon);
    console.log("Selected Gender:", selectedGender);
    console.log("Shiny Checked:", shinyChecked);
    console.log("Shadow Checked:", shadowChecked);
    
    // Determine if we need to use female data
    const isFemale = selectedGender === "Female";
    const hasFemaleData = matchedPokemon.female_data !== undefined;
    const hasUniqueFemaleForm = matchedPokemon.female_unique === 1;

    // Handle shiny and shadow variations
    if (shinyChecked && shadowChecked) {
      if (matchedPokemon.shadow_shiny_available) {
        url = isFemale && hasFemaleData && hasUniqueFemaleForm
          ? matchedPokemon.female_data.shiny_shadow_image_url || matchedPokemon.female_data.shiny_image_url || matchedPokemon.female_data.image_url
          : matchedPokemon.image_url_shiny_shadow || matchedPokemon.image_url_shiny;
      } else {
        url = isFemale && hasFemaleData && hasUniqueFemaleForm
          ? matchedPokemon.female_data.shadow_image_url || matchedPokemon.female_data.image_url
          : matchedPokemon.image_url_shadow;
      }
    } else if (shinyChecked) {
      url = isFemale && hasFemaleData && hasUniqueFemaleForm
        ? matchedPokemon.female_data.shiny_image_url || matchedPokemon.female_data.image_url
        : matchedPokemon.image_url_shiny;
    } else if (shadowChecked) {
      url = isFemale && hasFemaleData && hasUniqueFemaleForm
        ? matchedPokemon.female_data.shadow_image_url || matchedPokemon.female_data.image_url
        : matchedPokemon.image_url_shadow;
    } else {
      // Default to base image URL, taking female form into account if applicable
      url = isFemale && hasFemaleData && hasUniqueFemaleForm ? matchedPokemon.female_data.image_url : matchedPokemon.image_url;
    }

    // Handle costume selection
    if (selectedCostume && selectedCostume !== "") {
      const selectedCostumeData = matchedPokemon.costumes.find((costume) => costume.name === selectedCostume);
      if (selectedCostumeData) {
        // Use costume data for image URLs, checking for female data within the costume object if applicable
        if (isFemale && selectedCostumeData.image_url_female) {
          url = shinyChecked && shadowChecked
            ? selectedCostumeData.image_url_shiny_female || selectedCostumeData.image_url_female
            : shinyChecked
            ? selectedCostumeData.image_url_shiny_female || selectedCostumeData.image_url_female
            : shadowChecked
            ? selectedCostumeData.image_url_shadow || selectedCostumeData.image_url_female
            : selectedCostumeData.image_url_female;
        } else {
          // Check for shiny and shadow costume availability
          if (shinyChecked && shadowChecked) {
            url = selectedCostumeData.image_url_shiny_shadow || selectedCostumeData.image_url_shiny || selectedCostumeData.image_url;
          } else if (shadowChecked) {
            url = selectedCostumeData.image_url_shadow || selectedCostumeData.image_url;
          } else if (shinyChecked) {
            url = selectedCostumeData.image_url_shiny || selectedCostumeData.image_url;
          } else {
            url = selectedCostumeData.image_url;
          }
        }
      }
    }

    return url;
  }
  return null;
};