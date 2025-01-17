// fusionService.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/pokego.db');

// Existing function for single Pokémon
const getFusionsForPokemon = (pokemon_id, callback) => {
    const query = `
    SELECT 
        fusion.fusion_id, 
        fusion.base_pokemon_id1, 
        fusion.base_pokemon_id2, 
        fusion.name, 
        fusion.pokedex_number, 
        fusion.image_url, 
        fusion.image_url_shiny, 
        fusion.sprite_url, 
        fusion.attack, 
        fusion.defense, 
        fusion.stamina, 
        fusion.type_1_id, 
        fusion.type_2_id,
        fusion.generation, 
        fusion.available, 
        fusion.shiny_available, 
        fusion.shiny_rarity, 
        fusion.date_available, 
        fusion.date_shiny_available,
        t1.name AS type1_name, 
        t2.name AS type2_name
    FROM fusion
    LEFT JOIN types AS t1 ON fusion.type_1_id = t1.type_id
    LEFT JOIN types AS t2 ON fusion.type_2_id = t2.type_id
    WHERE fusion.base_pokemon_id1 = ? OR fusion.base_pokemon_id2 = ?
    `;
    
    db.all(query, [pokemon_id, pokemon_id], callback);
};

// New function to fetch all fusion data
const getAllFusions = (callback) => {
    const query = `
    SELECT 
        fusion.fusion_id, 
        fusion.base_pokemon_id1, 
        fusion.base_pokemon_id2, 
        fusion.name, 
        fusion.pokedex_number, 
        fusion.image_url, 
        fusion.image_url_shiny, 
        fusion.sprite_url, 
        fusion.attack, 
        fusion.defense, 
        fusion.stamina, 
        fusion.type_1_id, 
        fusion.type_2_id,
        fusion.generation, 
        fusion.available, 
        fusion.shiny_available, 
        fusion.shiny_rarity, 
        fusion.date_available, 
        fusion.date_shiny_available,
        t1.name AS type1_name, 
        t2.name AS type2_name
    FROM fusion_pokemon AS fusion
    LEFT JOIN types AS t1 ON fusion.type_1_id = t1.type_id
    LEFT JOIN types AS t2 ON fusion.type_2_id = t2.type_id
    `;
    
    db.all(query, [], callback);
};

const formatFusionData = (pokemons, fusionRows) => {
    const pokemonMap = {};

    pokemons.forEach(pokemon => {
        const {
            fusion_id, fusion_name, fusion_image_url, fusion_image_url_shiny, fusion_sprite_url,
            base_pokemon_id1, base_pokemon_id2,
            ...rest
        } = pokemon;
        pokemonMap[pokemon.pokemon_id] = { ...rest, fusion: [] };
    });

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
            type1_name: fusion.type1_name,
            type2_name: fusion.type2_name,
            generation: fusion.generation,
            available: fusion.available,
            shiny_available: fusion.shiny_available,
            shiny_rarity: fusion.shiny_rarity,
            date_available: fusion.date_available,
            date_shiny_available: fusion.date_shiny_available
        };

        if (pokemonMap[fusion.base_pokemon_id1]) {
            pokemonMap[fusion.base_pokemon_id1].fusion.push(fusionData);
        }
        if (pokemonMap[fusion.base_pokemon_id2]) {
            pokemonMap[fusion.base_pokemon_id2].fusion.push(fusionData);
        }
    });

    return Object.values(pokemonMap);
};

module.exports = {
    getFusionsForPokemon,
    getAllFusions,
    formatFusionData
};
