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

    // Ensure that shiny and shadow are both handled correctly
    if (variantType.includes('shadow') && variantType.includes('shiny')) {
        return pokemon.female_data.shiny_shadow_image_url || pokemon.image_url_shiny_shadow;
    }

    // Handle shadow or shiny separately
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

export function getTypeIconPath(typeName) {
    // Now using type's name to construct the image path, as per your backend changes
    return `/images/types/${typeName.toLowerCase()}.png`;
  }

// Utility function to preload images
export const preloadImage = (url) => {
    const img = new Image();
    img.src = url;
};