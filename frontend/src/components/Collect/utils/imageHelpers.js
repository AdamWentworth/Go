//imageHelpers.js

export function determineImageUrl(isFemale, pokemon) {
    if (!isFemale || !pokemon.female_data) {
      return pokemon.currentImage;
    }

    const variantType = pokemon.variantType.toLowerCase();

    // Check if variantType includes 'costume' and handle accordingly
    if (variantType.includes('costume')) {
        // Extract costume_id from the variantType string
        const costumeId = variantType.split('_')[1];
        
        // Find the matching costume based on costume_id
        const costume = pokemon.costumes?.find(c => c.costume_id.toString() === costumeId);

        if (costume) {
            // If variantType includes 'shiny', return shiny female costume image
            if (variantType.includes('shiny')) {
                return costume.image_url_shiny_female || costume.image_url_shiny;
            } 
            // Otherwise, return the regular female costume image
            return costume.image_url_female || costume.image_url;
        }
    }

    // Handle other cases (shadow, shiny, default)
    if (variantType.includes('shadow')) {
        return pokemon.shiny
            ? pokemon.female_data.shiny_shadow_image_url || pokemon.image_url_shiny_shadow
            : pokemon.female_data.shadow_image_url || pokemon.image_url_shadow;
    } else if (variantType.includes('shiny')) {
        return pokemon.female_data.shiny_image_url || pokemon.image_url_shiny;
    } else {
        return pokemon.female_data.image_url || pokemon.image_url;
    }
}

export function determinePokemonKey(pokemon) {
    let suffix = '';

    // Check for a match with the standard image URLs
    if (pokemon.currentImage === pokemon.image_url) {
        suffix = '-default';
    } else if (pokemon.currentImage === pokemon.image_url_shadow) {
        suffix = '-shadow';
    } else if (pokemon.currentImage === pokemon.image_url_shiny) {
        suffix = '-shiny';
    } else if (pokemon.currentImage === pokemon.image_url_shiny_shadow) {
        suffix = '-shiny_shadow';
    }

    // Check for Mega, Shiny Mega, Primal, and Shiny Primal Evolutions
    if (pokemon.variantType) {
        if (pokemon.variantType.startsWith('mega')) {
            suffix = `-${pokemon.variantType}`;
        } else if (pokemon.variantType.startsWith('shiny_mega')) {
            suffix = `-${pokemon.variantType}`;
        } else if (pokemon.variantType.startsWith('primal')) {
            suffix = `-${pokemon.variantType}`;
        } else if (pokemon.variantType.startsWith('shiny_primal')) {
            suffix = `-${pokemon.variantType}`;
        }
    }

    // Check for a match with costume image URLs
    if (pokemon.costumes) {
        pokemon.costumes.forEach(costume => {
            if (pokemon.currentImage === costume.image_url) {
                suffix = `-${costume.name}_default`;
            } else if (pokemon.currentImage === costume.image_url_shiny) {
                suffix = `-${costume.name}_shiny`;
            }

            // Additional checks for shadow costume images
            if (costume.shadow_costume) {
                if (pokemon.currentImage === costume.shadow_costume.image_url_shadow_costume) {
                    suffix = `-shadow_${costume.name}_default`;
                } else if (pokemon.currentImage === costume.shadow_costume.image_url_shiny_shadow_costume) {
                    suffix = `-shadow_${costume.name}_shiny`;
                }
            }
        });
    }

    // Construct the final pokemonKey with the determined suffix
    const pokemonKey = `${pokemon.pokemon_id}${suffix}`;

    return pokemonKey;
}

export function getTypeIconPath(typeName) {
    // Now using type's name to construct the image path, as per your backend changes
    return `/images/types/${typeName.toLowerCase()}.png`;
  }

// Utility function to preload images
export const preloadImage = (url) => {
    const img = new Image();
    img.src = url;
};