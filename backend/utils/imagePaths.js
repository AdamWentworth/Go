const getImagePathsForPokemon = (pokemon) => {
    let shadowImagePath = null;
    let shinyShadowImagePath = null;

    // If pokemon exists in shadow_pokemon table
    if (pokemon.shadow_shiny_available !== null || pokemon.shadow_apex !== null) {
        shadowImagePath = `/images/shadow/shadow_pokemon_${pokemon.pokemon_id}.png`;
        shinyShadowImagePath = `/images/shiny_shadow/shiny_shadow_pokemon_${pokemon.pokemon_id}.png`;
    }

    let type1Icon = pokemon.type1_name ? `/images/types/${pokemon.type1_name.toLowerCase()}.png` : null;
    let type2Icon = pokemon.type2_name ? `/images/types/${pokemon.type2_name.toLowerCase()}.png` : null;

    return {
        ...pokemon,
        shadow_image: shadowImagePath,
        shiny_shadow_image: shinyShadowImagePath,
        type_1_icon: type1Icon,
        type_2_icon: type2Icon,
    };
};

module.exports = {
    getImagePathsForPokemon,
};
