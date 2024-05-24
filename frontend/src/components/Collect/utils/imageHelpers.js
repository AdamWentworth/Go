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

    // Check for a match with costume image URLs
    pokemon.costumes.forEach(costume => {
        if (pokemon.currentImage === costume.image_url) {
            suffix = `-${costume.name}_default`;
        } else if (pokemon.currentImage === costume.image_url_shiny) {
            suffix = `-${costume.name}_shiny`;
        }
    });

    // Construct the final pokemonKey with the determined suffix
    const pokemonKey = `${pokemon.pokemon_id}${suffix}`;

    return pokemonKey;
}

export function getTypeIconPath(typeName) {
    // Now using type's name to construct the image path, as per your backend changes
    return `/images/types/${typeName.toLowerCase()}.png`;
  }