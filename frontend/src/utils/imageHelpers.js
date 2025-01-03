//imageHelpers.js

export function determineImageUrl(isFemale, pokemon, isMega = false, megaForm = undefined) {
    const DEFAULT_IMAGE_URL = '/images/default_pokemon.png';

    if (!pokemon) {
        console.warn('determineImageUrl called without a valid pokemon object.');
        return DEFAULT_IMAGE_URL;
    }

    const isShiny = !!pokemon.ownershipStatus?.shiny;
    const variantType = (pokemon.variantType || '').toLowerCase();

    /**
     * Retrieves the appropriate costume image URL.
     *
     * @param {Array} costumes - Array of costume objects.
     * @param {string} variantType - The variant type string.
     * @param {boolean} isFemale - Indicates if the Pokemon is female.
     * @param {boolean} isShiny - Indicates if the Pokemon is shiny.
     * @returns {string|null} - The image URL or null if not found.
     */
    const getCostumeImage = (costumes, variantType, isFemale, isShiny) => {
        const costumeIdMatch = variantType.match(/_(\d+)/);
        if (!costumeIdMatch) return null;

        const costumeId = costumeIdMatch[1];
        const costume = costumes?.find(c => c.costume_id.toString() === costumeId);

        if (!costume) return null;
        
        // Handle Shadow Costumes
        if (variantType.includes('shadow_')) {

            const shadow = costume.shadow_costume;
            if (shadow) {

                if (isShiny && shadow.image_url_shiny_shadow_costume) {
                    return isFemale
                        ? shadow.image_url_female_shiny_shadow_costume || shadow.image_url_shiny_shadow_costume
                        : shadow.image_url_shiny_shadow_costume;
                }

                return isFemale
                    ? shadow.image_url_female_shadow_costume || shadow.image_url_shadow_costume
                    : shadow.image_url_shadow_costume;
            }
        }

        // Handle Regular Costumes
        if (variantType.includes('costume')) {
            if (isShiny) {
                return isFemale
                    ? costume.image_url_shiny_female || costume.image_url_shiny || DEFAULT_IMAGE_URL
                    : costume.image_url_shiny || DEFAULT_IMAGE_URL;
            }

            return isFemale
                ? costume.image_url_female || costume.image_url || DEFAULT_IMAGE_URL
                : costume.image_url || DEFAULT_IMAGE_URL;
        }

        return null;
    };

    /**
     * Retrieves the appropriate variant image URL.
     *
     * @param {Object} data - The data object containing image URLs.
     * @param {string} variantType - The variant type string.
     * @param {boolean} isShiny - Indicates if the Pokemon is shiny.
     * @param {string} defaultUrl - The default image URL to fallback.
     * @returns {string} - The image URL.
     */
    const getVariantImage = (data, variantType, isShiny, defaultUrl) => {
        if (variantType.includes('shadow') && variantType.includes('shiny')) {
            return data.shiny_shadow_image_url || data.image_url_shiny_shadow || defaultUrl;
        }

        if (variantType.includes('shadow')) {
            return isShiny
                ? data.shiny_shadow_image_url || data.image_url_shiny_shadow || defaultUrl
                : data.shadow_image_url || data.image_url_shadow || defaultUrl;
        }

        if (variantType.includes('shiny')) {
            return data.shiny_image_url || data.image_url_shiny || defaultUrl;
        }

        return data.image_url || defaultUrl;
    };

    /**
     * Retrieves the image URL for Mega Evolutions.
     *
     * @returns {string} - The image URL for the Mega Evolution.
     */
    const handleMegaEvolution = () => {
        if (!isMega || !Array.isArray(pokemon.megaEvolutions) || pokemon.megaEvolutions.length === 0) {
            return null;
        }

        let megaEvolution = null;

        if (pokemon.megaEvolutions.length === 1 || !megaForm) {
            megaEvolution = pokemon.megaEvolutions[0];
        } else {
            megaEvolution = pokemon.megaEvolutions.find(me =>
                me.form?.toLowerCase() === megaForm.toLowerCase()
            );

            if (!megaEvolution) {
                console.warn(`Unable to find mega evolution form: ${megaForm}`);
                megaEvolution = pokemon.megaEvolutions[0];
            }
        }

        const megaVariantType = (megaEvolution.variantType || '').toLowerCase();

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

        if (isFemale && megaEvolution.female_data) {
            return getVariantImage(
                megaEvolution.female_data,
                megaVariantType,
                isShiny,
                megaEvolution.image_url || DEFAULT_IMAGE_URL
            );
        }

        if (isShiny) {
            return megaEvolution.image_url_shiny || megaEvolution.image_url || DEFAULT_IMAGE_URL;
        }

        return megaEvolution.image_url || DEFAULT_IMAGE_URL;
    };

    // Attempt to get Mega Evolution image first
    const megaImage = handleMegaEvolution();
    if (megaImage) {
        return megaImage;
    }

    /**
     * Retrieves the image URL for non-Mega Evolutions.
     *
     * @returns {string} - The image URL for the Pokemon.
     */
    const handleNonMegaEvolution = () => {
        if (isFemale && pokemon.female_data) {
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

            return getVariantImage(
                pokemon.female_data,
                variantType,
                isShiny,
                pokemon.image_url || DEFAULT_IMAGE_URL
            );
        }

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

        if (variantType.includes('shadow') || variantType.includes('shiny')) {
            return getVariantImage(
                pokemon,
                variantType,
                isShiny,
                pokemon.image_url || DEFAULT_IMAGE_URL
            );
        }

        return pokemon.image_url || DEFAULT_IMAGE_URL;
    };

    // Return the appropriate image URL for non-Mega Evolutions
    return handleNonMegaEvolution();
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