const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('D:/Visual-Studio-Code/Go/backend/data/pokego.db');

const getEvolutionsFromDb = (callback) => {
    const evolutionQuery = `
        SELECT
            pe.pokemon_id,
            pe.evolves_to
        FROM pokemon_evolutions pe
    `;

    db.all(evolutionQuery, [], (err, evolutions) => {
        if (err) {
            callback(err, null);
        } else {
            const evolutionMap = buildEvolutionMap(evolutions);
            callback(null, evolutionMap);
        }
    });
};

const buildEvolutionMap = (evolutions) => {
    const evolutionMap = {};

    // First, we establish a map with default evolves_from and evolves_to as null
    evolutions.forEach(evo => {
        if (!evolutionMap[evo.pokemon_id]) {
            evolutionMap[evo.pokemon_id] = { evolves_to: null };
        }
        if (evo.evolves_to && !evolutionMap[evo.evolves_to]) {
            evolutionMap[evo.evolves_to] = { evolves_from: null };
        }
    });

    // Then we fill in the actual evolves_to and evolves_from values
    evolutions.forEach(evo => {
        if (evo.evolves_to) {
            evolutionMap[evo.pokemon_id].evolves_to = evo.evolves_to;
            evolutionMap[evo.evolves_to].evolves_from = evo.pokemon_id;
        }
    });

    return evolutionMap;
};


module.exports = {
    getEvolutionsFromDb,
    buildEvolutionMap, // add this line to export the function
};
