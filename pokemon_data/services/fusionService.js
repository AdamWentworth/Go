// fusionService.js
const formatFusionData = (pokemons, fusionRows) => {
    const pokemonMap = {};
    
    // Initialize each Pokémon with an empty fusion array,
    // removing any fusion-specific properties from the base object
    pokemons.forEach(pokemon => {
        const {
            fusion_id, fusion_name, fusion_image_url, fusion_image_url_shiny, fusion_sprite_url,
            base_pokemon_id1, base_pokemon_id2, // destructure fusion-related fields
            ...rest
        } = pokemon;
        pokemonMap[pokemon.pokemon_id] = { ...rest, fusion: [] };
    });

    // Loop over each fusion record and add fusion data to the corresponding base Pokémon
    fusionRows.forEach(fusion => {
        const fusionData = {
            fusion_id: fusion.fusion_id,
            base_pokemon_id1: fusion.base_pokemon_id1,
            base_pokemon_id2: fusion.base_pokemon_id2,
            name: fusion.name,
            pokedex_number: fusion.pokedex_number,
            image_url: fusion.image_url,
            image_url_shiny: fusion.image_url_shiny,
            sprite_url: fusion.sprite_url,
            attack: fusion.attack,
            defense: fusion.defense,
            stamina: fusion.stamina,
            type_1_id: fusion.type_1_id,
            type_2_id: fusion.type_2_id,
            generation: fusion.generation,
            available: fusion.available,
            shiny_available: fusion.shiny_available,
            shiny_rarity: fusion.shiny_rarity,
            date_available: fusion.date_available,
            date_shiny_available: fusion.date_shiny_available
        };

        // Add fusion data to the first base Pokémon if it exists
        if (pokemonMap[fusion.base_pokemon_id1]) {
            pokemonMap[fusion.base_pokemon_id1].fusion.push(fusionData);
        }
        // Add fusion data to the second base Pokémon if it exists
        if (pokemonMap[fusion.base_pokemon_id2]) {
            pokemonMap[fusion.base_pokemon_id2].fusion.push(fusionData);
        }
    });

    // Return the updated list of Pokémon objects with fusion data attached in the .fusion array
    return Object.values(pokemonMap);
};

module.exports = {
    formatFusionData
};
