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
        sp.date_available,
        sp.date_shiny_available,
        sp.image_url_shadow,
        sp.image_url_shiny_shadow
    FROM pokemon 
    LEFT JOIN types AS t1 ON pokemon.type_1_id = t1.type_id 
    LEFT JOIN types AS t2 ON pokemon.type_2_id = t2.type_id 
    LEFT JOIN shadow_pokemon AS sp ON pokemon.pokemon_id = sp.pokemon_id
    WHERE available = 1 
    ORDER BY pokedex_number ASC
    `;

    db.all(query, [], (err, rows) => {
        callback(err, rows);
    });
};

module.exports = {
    getPokemonsFromDb,
};
