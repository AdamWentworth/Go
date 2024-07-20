// fusionService.js
const formatFusionData = (pokemons) => {
    const pokemonMap = {};
    
    // Create a map of pokemon_id to pokemon object
    pokemons.forEach(pokemon => {
        // Filter out fusion specific fields from the main pokemon object
        const { fusion_id, fusion_name, fusion_image_url, fusion_image_url_shiny, fusion_sprite_url, base_pokemon_id1, base_pokemon_id2, ...rest } = pokemon;
        pokemonMap[pokemon.pokemon_id] = { ...rest, fusion: [] };
    });

    // Add fusion data to the base pokemon
    pokemons.forEach(pokemon => {
        if (pokemon.fusion_id) {
            const fusionData = {
                fusion_id: pokemon.fusion_id,
                name: pokemon.fusion_name,
                image_url: pokemon.fusion_image_url,
                image_url_shiny: pokemon.fusion_image_url_shiny,
                sprite_url: pokemon.fusion_sprite_url
            };
            if (pokemonMap[pokemon.base_pokemon_id1]) {
                pokemonMap[pokemon.base_pokemon_id1].fusion.push(fusionData);
            }
            if (pokemonMap[pokemon.base_pokemon_id2]) {
                pokemonMap[pokemon.base_pokemon_id2].fusion.push(fusionData);
            }
        }
    });

    // Return the array of pokemon objects with fusion data embedded
    return Object.values(pokemonMap);
};

module.exports = {
    formatFusionData
};