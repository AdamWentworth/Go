//imageHelpers.js

export function determineImageUrl(isFemale, isMega, pokemon, megaForm) {
    if (!pokemon) {
        console.warn('determineImageUrl called without a valid pokemon object.');
        return '/images/default_pokemon.png';
    }

    const isShiny = pokemon.ownershipStatus?.shiny || false;
    const variantType = (pokemon.variantType || '').toLowerCase();

    // Helper function to handle costume images
    const getCostumeImage = (costumes, variantType, isFemale, isShiny) => {
        const costumeId = variantType.split('_')[1];
        const costume = costumes?.find(c => c.costume_id.toString() === costumeId);

        if (costume) {
            if (variantType.includes('shiny')) {
                return isFemale
                    ? costume.image_url_shiny_female || costume.image_url_shiny || '/images/default_pokemon.png'
                    : costume.image_url_shiny || '/images/default_pokemon.png';
            }
            return isFemale
                ? costume.image_url_female || costume.image_url || '/images/default_pokemon.png'
                : costume.image_url || '/images/default_pokemon.png';
        }

        return null;
    };

    // Helper function to handle shadow and shiny images
    const getVariantImage = (data, variantType, isShiny, defaultUrl) => {
        if (variantType.includes('shadow') && variantType.includes('shiny')) {
            return data.shiny_shadow_image_url || data.image_url_shiny_shadow || defaultUrl;
        }

        if (variantType.includes('shadow')) {
            return isShiny
                ? data.shiny_shadow_image_url || data.image_url_shiny_shadow || defaultUrl
                : data.shadow_image_url || data.image_url_shadow || defaultUrl;
        } else if (variantType.includes('shiny')) {
            return data.shiny_image_url || data.image_url_shiny || defaultUrl;
        } else {
            return data.image_url || defaultUrl;
        }
    };

    // Handle Mega Evolution
    if (isMega && Array.isArray(pokemon.megaEvolutions) && pokemon.megaEvolutions.length > 0) {
        let megaEvolution = null;

        if (pokemon.megaEvolutions.length === 1) {
            megaEvolution = pokemon.megaEvolutions[0];
        } else if (megaForm) {
            megaEvolution = pokemon.megaEvolutions.find(me => 
                me.form?.toLowerCase() === megaForm.toLowerCase()
            );
            
            if (!megaEvolution) {
                console.warn(`Unable to find mega evolution form: ${megaForm}`);
                megaEvolution = pokemon.megaEvolutions[0];
            }
        } else {
            megaEvolution = pokemon.megaEvolutions[0];
        }

        // Determine variant type for Mega Evolution
        const megaVariantType = (megaEvolution.variantType || '').toLowerCase();

        // Handle costume within Mega Evolution
        if (megaVariantType.includes('costume')) {
            const costumeImage = getCostumeImage(
                megaEvolution.costumes,
                megaVariantType,
                isFemale,
                isShiny
            );
            if (costumeImage) {
                return costumeImage;
            }
        }

        // Handle shadow and shiny within Mega Evolution
        if (isFemale && megaEvolution.female_data) {
            return getVariantImage(
                megaEvolution.female_data,
                megaVariantType,
                isShiny,
                megaEvolution.image_url || '/images/default_pokemon.png'
            );
        }

        // Handle non-female Mega Evolution images
        if (isShiny) {
            return megaEvolution.image_url_shiny || megaEvolution.image_url || '/images/default_pokemon.png';
        }
        return megaEvolution.image_url || '/images/default_pokemon.png';
    }

    // Handle gender-specific images, including costumes
    if (isFemale && pokemon.female_data) {
        // Handle costume
        if (variantType.includes('costume')) {
            const costumeImage = getCostumeImage(
                pokemon.costumes,
                variantType,
                isFemale,
                isShiny
            );
            if (costumeImage) {
                return costumeImage;
            }
        }

        // Handle shadow and shiny variants
        return getVariantImage(
            pokemon.female_data,
            variantType,
            isShiny,
            pokemon.image_url || '/images/default_pokemon.png'
        );
    }

    // Handle non-female images, including costumes
    // Handle costume
    if (variantType.includes('costume')) {
        const costumeImage = getCostumeImage(
            pokemon.costumes,
            variantType,
            isFemale,
            isShiny
        );
        if (costumeImage) {
            return costumeImage;
        }
    }

    // Handle shadow and shiny variants
    if (variantType.includes('shadow') || variantType.includes('shiny')) {
        return getVariantImage(
            pokemon,
            variantType,
            isShiny,
            pokemon.image_url || '/images/default_pokemon.png'
        );
    }

    // Default image
    return pokemon.image_url || '/images/default_pokemon.png';
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