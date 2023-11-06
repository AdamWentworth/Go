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

    // First pass: Ensure all relevant keys exist in the evolutionMap
    evolutions.forEach(evo => {
        if (!evolutionMap[evo.pokemon_id]) {
            evolutionMap[evo.pokemon_id] = { evolves_to: [], evolves_from: [] };
        }
        if (evo.evolves_to && !evolutionMap[evo.evolves_to]) {
            evolutionMap[evo.evolves_to] = { evolves_to: [], evolves_from: [] };
        }
    });

    // Second pass: Assign the evolution data
    evolutions.forEach(evo => {
        // Add to evolves_to array for the evolving Pokémon
        if (evo.evolves_to) {
            evolutionMap[evo.pokemon_id].evolves_to.push(evo.evolves_to);
        }

        // Add to evolves_from array for the Pokémon it evolves into
        if (evolutionMap[evo.evolves_to]) {
            evolutionMap[evo.evolves_to].evolves_from.push(evo.pokemon_id);
        }
    });

    // Cleanup: Remove any empty evolves_to or evolves_from arrays
    Object.keys(evolutionMap).forEach(pokemonId => {
        if (evolutionMap[pokemonId].evolves_to.length === 0) {
            delete evolutionMap[pokemonId].evolves_to;
        }
        if (evolutionMap[pokemonId].evolves_from.length === 0) {
            delete evolutionMap[pokemonId].evolves_from;
        }
    });

    return evolutionMap;
};

module.exports = {
    getEvolutionsFromDb,
    buildEvolutionMap, // add this line to export the function
};
