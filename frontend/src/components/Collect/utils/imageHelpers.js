//imageHelpers.js

export function determinePokemonImage(pokemon, isShiny, showShadow, costume) {
    let baseObject = costume || pokemon;

    if (isShiny && showShadow) {
        return baseObject.image_url_shiny_shadow;
    } else if (isShiny) {
        return baseObject.image_url_shiny;
    } else if (showShadow) {
        return baseObject.image_url_shadow;
    }
    return baseObject.image_url;
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

    // Check for Mega and Shiny Mega Evolutions
    if (pokemon.variantType && pokemon.variantType.startsWith('mega_')) {
        suffix = `-${pokemon.variantType}`;
    } else if (pokemon.variantType && pokemon.variantType.startsWith('shiny_mega_')) {
        suffix = `-${pokemon.variantType}`;
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