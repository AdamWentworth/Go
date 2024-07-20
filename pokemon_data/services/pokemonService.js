// pokemonService.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/pokego.db');

const getPokemonsFromDb = (callback) => {
    const query = `
    SELECT 
        pokemon.*,
        t1.name AS type1_name, 
        t2.name AS type2_name,
        sp.shiny_available AS shadow_shiny_available,
        sp.apex AS shadow_apex,
        sp.date_available AS date_shadow_available,
        sp.date_shiny_available AS date_shiny_shadow_available,
        sp.image_url_shadow,
        sp.image_url_shiny_shadow,
        fusion_pokemon.fusion_id,
        fusion_pokemon.name AS fusion_name,
        fusion_pokemon.image_url AS fusion_image_url,
        fusion_pokemon.image_url_shiny AS fusion_image_url_shiny,
        fusion_pokemon.sprite_url AS fusion_sprite_url,
        fusion_pokemon.base_pokemon_id1,
        fusion_pokemon.base_pokemon_id2
    FROM pokemon 
    LEFT JOIN types AS t1 ON pokemon.type_1_id = t1.type_id 
    LEFT JOIN types AS t2 ON pokemon.type_2_id = t2.type_id 
    LEFT JOIN shadow_pokemon AS sp ON pokemon.pokemon_id = sp.pokemon_id
    LEFT JOIN fusion_pokemon ON pokemon.pokemon_id = fusion_pokemon.pokemon_id
    WHERE pokemon.available = 1 
    ORDER BY pokemon.pokedex_number ASC
    `;

    db.all(query, [], (err, rows) => {
        callback(err, rows);
    });
};

module.exports = {
    getPokemonsFromDb,
};
