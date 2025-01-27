//imageHelpers.js

export function determineImageUrl(
    isFemale,
    pokemon,
    isMega = false,
    megaForm = undefined,
    isFused = false,
    fusionForm = undefined,
    isPurified = false,
    gigantamax = false
) {
    const DEFAULT_IMAGE_URL = '/images/default_pokemon.png';

    if (!pokemon) {
        console.warn('determineImageUrl called without a valid pokemon object.');
        return DEFAULT_IMAGE_URL;
    }

    // Specific Handling for Apex Lugia and Ho-Oh
    if (pokemon.pokemon_id === 2301 || pokemon.pokemon_id === 2302) {
        if (isPurified === false) {
            return pokemon.image_url_shadow;
        }
    }

    // Determine if the Pokemon should be treated as shiny based on purification
    const isPurifiedShiny = isPurified && pokemon.variantType.includes('shiny');
    const isShiny = isPurifiedShiny || pokemon.variantType.includes('shiny');

    // **New Priority: Handle Mega Evolution first to supersede Purified**
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

    if (isPurified) {        
        if (!pokemon) {
            console.error("pokemon is undefined or null! Check where it's coming from.");
            return null;
        }    
        if (isPurifiedShiny && pokemon.image_url_shiny) {
            return pokemon.image_url_shiny;
        } else if (pokemon.image_url) {
            return pokemon.image_url;
        }
    }    

    // Check for fusion override before other image logic
    if (isFused && fusionForm && Array.isArray(pokemon.fusion)) {
        const fusionEntry = pokemon.fusion.find(f => f.name === fusionForm);
        if (fusionEntry) {
            // Use shiny property from ownershipStatus if applicable
            if (isShiny) {
                return fusionEntry.image_url_shiny || fusionEntry.image_url || DEFAULT_IMAGE_URL;
            }
            return fusionEntry.image_url || DEFAULT_IMAGE_URL;
        }
    }

    // Define helper functions
    const variantType = (pokemon.variantType || '').toLowerCase();

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
                if (isShiny) {
                    return isFemale
                        ? shadow.image_url_female_shiny_shadow_costume || shadow.image_url_shiny_shadow_costume
                        : shadow.image_url_shiny_shadow_costume;
                }
                return isFemale
                    ? shadow.image_url_female_shadow_costume || shadow.image_url_shadow_costume
                    : shadow.image_url_shadow_costume;
            }
        }

        // Handle Regular Costumes - Fixed to properly handle shiny images
        if (variantType.includes('costume')) {
            // Check if the Pokemon is shiny or if the variant type includes shiny
            if (isShiny || variantType.includes('shiny')) {
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

    const getVariantImage = (data, variantType, isShiny, defaultUrl) => {
        if (variantType.includes('shadow') && (isShiny || variantType.includes('shiny'))) {
            return data.shiny_shadow_image_url || data.image_url_shiny_shadow || defaultUrl;
        }

        if (variantType.includes('shadow')) {
            return isShiny
                ? data.shiny_shadow_image_url || data.image_url_shiny_shadow || defaultUrl
                : data.shadow_image_url || data.image_url_shadow || defaultUrl;
        }

        if (isShiny || variantType.includes('shiny')) {
            return data.shiny_image_url || data.image_url_shiny || defaultUrl;
        }

        return data.image_url || defaultUrl;
    };

    // **Handle Gigantamax Variants Based on variantType**
    if (variantType === 'gigantamax' || variantType === 'shiny_gigantamax') {
        if (pokemon.currentImage) {
            return pokemon.currentImage;
        } else {
            console.warn(`Gigantamax variantType specified but currentImage is missing for Pokémon ID: ${pokemon.pokemon_id}`);
            return DEFAULT_IMAGE_URL;
        }
    }

    // Add Gigantamax handling after Mega Evolution using the gigantamax flag
    if (gigantamax && Array.isArray(pokemon.max) && pokemon.max.length > 0) {
        const maxEntry = pokemon.max[0];
        if (isShiny && maxEntry.shiny_gigantamax_image_url) {
            return maxEntry.shiny_gigantamax_image_url;
        } else if (maxEntry.gigantamax_image_url) {
            return maxEntry.gigantamax_image_url;
        }
    }

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

        return getVariantImage(
            pokemon,
            variantType,
            isShiny,
            pokemon.image_url || DEFAULT_IMAGE_URL
        );
    };

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