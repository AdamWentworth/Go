// cpService.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/pokego.db');

const getCpForPokemon = (pokemon_id, callback) => {
    const query = `
    SELECT level_id, cp FROM pokemon_cp_stats
    WHERE pokemon_id = ? AND level_id IN (40, 50)
    ORDER BY level_id ASC
    `;

    db.all(query, [pokemon_id], (err, rows) => {
        callback(err, rows);
    });
};

const getCpForMegaEvolution = (mega_id, callback) => {
    const query = `
    SELECT level_id, cp FROM mega_cp_stats
    WHERE mega_id = ? AND level_id IN (40, 50)
    ORDER BY level_id ASC
    `;

    db.all(query, [mega_id], (err, rows) => {
        callback(err, rows);
    });
};

module.exports = {
    getCpForPokemon,
    getCpForMegaEvolution,
};
