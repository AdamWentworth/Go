const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/pokego.db');

const getMegaEvolutionsForPokemon = (pokemon_id, callback) => {
    const query = `
    SELECT 
        mega_evolution.id, 
        mega_evolution.mega_energy_cost, 
        mega_evolution.attack, 
        mega_evolution.defense, 
        mega_evolution.stamina, 
        mega_evolution.image_url, 
        mega_evolution.image_url_shiny, 
        mega_evolution.sprite_url, 
        mega_evolution.primal, 
        mega_evolution.form, 
        mega_evolution.type_1_id, 
        mega_evolution.type_2_id,
        t1.name AS type1_name, 
        t2.name AS type2_name
    FROM mega_evolution
    LEFT JOIN types AS t1 ON mega_evolution.type_1_id = t1.type_id
    LEFT JOIN types AS t2 ON mega_evolution.type_2_id = t2.type_id
    WHERE mega_evolution.pokemon_id = ?
    `;
    db.all(query, [pokemon_id], (err, rows) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
};

module.exports = {
    getMegaEvolutionsForPokemon,
};
