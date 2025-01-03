// utils/imageHelpers.js

export function determineImageUrl(isFemale, isMega, pokemon, megaForm) {
    if (!pokemon) {
        console.warn('determineImageUrl called without a valid pokemon object.');
        return '/images/default_pokemon.png';
    }

    // Handle Mega Evolution
    if (isMega && Array.isArray(pokemon.megaEvolutions) && pokemon.megaEvolutions.length > 0) {
        let megaEvolution = null;

        if (pokemon.megaEvolutions.length === 1) {
            megaEvolution = pokemon.megaEvolutions[0];
        } else if (megaForm) {
            megaEvolution = pokemon.megaEvolutions.find(me => 
                me.form?.toLowerCase() === megaForm?.toLowerCase()
            );
            
            if (!megaEvolution) {
                console.warn(`Unable to find mega evolution form: ${megaForm}`);
                megaEvolution = pokemon.megaEvolutions[0];
            }
        } else {
            megaEvolution = pokemon.megaEvolutions[0];
        }

        if (pokemon.ownershipStatus?.shiny) {
            return megaEvolution.image_url_shiny || megaEvolution.image_url || '/images/default_pokemon.png';
        }
        return megaEvolution.image_url || '/images/default_pokemon.png';
    }

    // Handle gender-specific images
    if (isFemale && pokemon.female_data) {
        const variantType = (pokemon.variantType || '').toLowerCase();

        // Check if variantType includes 'costume' and handle accordingly
        if (variantType.includes('costume')) {
            // Extract costume_id from the variantType string
            const costumeId = variantType.split('_')[1];

            // Find the matching costume based on costume_id
            const costume = pokemon.costumes?.find(c => c.costume_id.toString() === costumeId);

            if (costume) {
                // If variantType includes 'shiny', return shiny female costume image
                if (variantType.includes('shiny')) {
                    return costume.image_url_shiny_female || costume.image_url_shiny || '/images/default_pokemon.png';
                }
                // Otherwise, return the regular female costume image
                return costume.image_url_female || costume.image_url || '/images/default_pokemon.png';
            }
        }

        // Handle shadow and shiny variants
        if (variantType.includes('shadow') && variantType.includes('shiny')) {
            return pokemon.female_data.shiny_shadow_image_url || pokemon.image_url_shiny_shadow || '/images/default_pokemon.png';
        }

        if (variantType.includes('shadow')) {
            return pokemon.shiny
                ? (pokemon.female_data.shiny_shadow_image_url || pokemon.image_url_shiny_shadow || '/images/default_pokemon.png')
                : (pokemon.female_data.shadow_image_url || pokemon.image_url_shadow || '/images/default_pokemon.png');
        } else if (variantType.includes('shiny')) {
            return pokemon.female_data.shiny_image_url || pokemon.image_url_shiny || '/images/default_pokemon.png';
        } else {
            return pokemon.female_data.image_url || pokemon.image_url || '/images/default_pokemon.png';
        }
    }

    // Handle non-female images and other variants
    const variantType = (pokemon.variantType || '').toLowerCase();

    // Check if variantType includes 'shadow' and 'shiny'
    if (variantType.includes('shadow') && variantType.includes('shiny')) {
        return pokemon.image_url_shiny_shadow || '/images/default_pokemon.png';
    }

    if (variantType.includes('shadow')) {
        return pokemon.shiny
            ? (pokemon.image_url_shiny_shadow || '/images/default_pokemon.png')
            : (pokemon.image_url_shadow || '/images/default_pokemon.png');
    } else if (variantType.includes('shiny')) {
        return pokemon.image_url_shiny || '/images/default_pokemon.png';
    } else {
        return pokemon.image_url || '/images/default_pokemon.png';
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