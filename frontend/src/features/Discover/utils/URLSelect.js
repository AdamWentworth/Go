// utils/selectURL.js

export const URLSelect = (pokemonInfo, item) => {
  if (!pokemonInfo) {
    return null;
  }

  let url = pokemonInfo.image_url;

  const isDynamax = item.dynamax;
  const isGigantamax = item.gigantamax;
  const isShiny = item.shiny;
  const isShadow = item.shadow;
  const selectedCostumeId = item.costume_id; // Assuming costume_id corresponds to a costume
  const selectedGender = item.gender; // Assuming gender is 'Male', 'Female', or 'Genderless'

  const isFemale = selectedGender === 'Female';
  const hasFemaleData = pokemonInfo.female_data !== undefined;
  const hasUniqueFemaleForm = pokemonInfo.female_unique === 1;

  // Handle Gigantamax first, as it takes precedence over other forms
  if (isGigantamax) {
    if (pokemonInfo.max && pokemonInfo.max.length > 0) {
      const gigantamaxData = pokemonInfo.max[0];
      if (isShiny) {
        url = gigantamaxData.shiny_gigantamax_image_url || url;
      } else {
        url = gigantamaxData.gigantamax_image_url || url;
      }
    }
  } else {
    // Handle Dynamax, Shiny, Shadow, and Female variations as before
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
    } else if (isDynamax) {
      // Handle Dynamax Image
      if (pokemonInfo.max && pokemonInfo.max.length > 0) {
        const dynamaxData = pokemonInfo.max[0];
        url = isShiny
          ? dynamaxData.shiny_dynamax_image_url || dynamaxData.dynamax_image_url || url
          : dynamaxData.dynamax_image_url || url;
      }
    } else {
      // Default to base image URL, taking female form into account if applicable
      url = isFemale && hasFemaleData && hasUniqueFemaleForm 
        ? pokemonInfo.female_data.image_url 
        : pokemonInfo.image_url;
    }
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

      // If Gigantamax is selected within a costume, override the URL accordingly
      if (isGigantamax && selectedCostumeData.max && selectedCostumeData.max.length > 0) {
        const costumeGigantamaxData = selectedCostumeData.max[0];
        if (isShiny) {
          url = costumeGigantamaxData.shiny_gigantamax_image_url || url;
        } else {
          url = costumeGigantamaxData.gigantamax_image_url || url;
        }
      }
    }
  }

  return url;
};
