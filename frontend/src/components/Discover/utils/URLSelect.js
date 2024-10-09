// utils/selectURL.js

export const URLSelect = (pokemonInfo, item) => {
  if (!pokemonInfo) {
    return null;
  }

  let url = pokemonInfo.image_url;

  const isShiny = item.shiny;
  const isShadow = item.shadow;
  const selectedCostumeId = item.costume_id; // Assuming costume_id corresponds to a costume
  const selectedGender = item.gender; // Assuming gender is 'Male', 'Female', or 'Genderless'

  const isFemale = selectedGender === 'Female';
  const hasFemaleData = pokemonInfo.female_data !== undefined;
  const hasUniqueFemaleForm = pokemonInfo.female_unique === 1;

  // Handle shiny and shadow variations
  if (isShiny && isShadow) {
    if (pokemonInfo.shadow_shiny_available) {
      url = isFemale && hasFemaleData && hasUniqueFemaleForm
        ? pokemonInfo.female_data.shiny_shadow_image_url
        : pokemonInfo.image_url_shiny_shadow;
    } else {
      url = isFemale && hasFemaleData && hasUniqueFemaleForm
        ? pokemonInfo.female_data.shadow_image_url
        : pokemonInfo.image_url_shadow;
    }
  } else if (isShiny) {
    url = isFemale && hasFemaleData && hasUniqueFemaleForm
      ? pokemonInfo.female_data.shiny_image_url
      : pokemonInfo.image_url_shiny;
  } else if (isShadow) {
    url = isFemale && hasFemaleData && hasUniqueFemaleForm
      ? pokemonInfo.female_data.shadow_image_url
      : pokemonInfo.image_url_shadow;
  } else {
    // Default to base image URL, taking female form into account if applicable
    url = isFemale && hasFemaleData && hasUniqueFemaleForm 
      ? pokemonInfo.female_data.image_url 
      : pokemonInfo.image_url;
  }

  // Handle costume selection
  if (selectedCostumeId && pokemonInfo.costumes && pokemonInfo.costumes.length > 0) {
    const selectedCostumeData = pokemonInfo.costumes.find(costume => costume.costume_id === selectedCostumeId);
    if (selectedCostumeData) {
      // Use costume data for image URLs, checking for female data within the costume object if applicable
      if (isFemale && selectedCostumeData.image_url_female) {
        url = isShiny && isShadow
          ? selectedCostumeData.image_url_shiny_shadow_female || selectedCostumeData.image_url_shiny_female || selectedCostumeData.image_url_female
          : isShiny
          ? selectedCostumeData.image_url_shiny_female || selectedCostumeData.image_url_female
          : isShadow
          ? selectedCostumeData.image_url_shadow_female || selectedCostumeData.image_url_female
          : selectedCostumeData.image_url_female;
      } else {
        // Check for shiny and shadow costume availability
        url = isShiny && isShadow
          ? selectedCostumeData.image_url_shiny_shadow || selectedCostumeData.image_url_shiny || selectedCostumeData.image_url
          : isShadow
          ? selectedCostumeData.image_url_shadow || selectedCostumeData.image_url
          : isShiny
          ? selectedCostumeData.image_url_shiny || selectedCostumeData.image_url
          : selectedCostumeData.image_url;
      }
    }
  }
  
  return url;
};
