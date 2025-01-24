// services/maxPokemonService.js

const logger = require('../middlewares/logger');

/**
 * Fetches max_pokemon data for the given list of Pokémon IDs.
 * 
 * @param {sqlite3.Database} db - The SQLite database instance.
 * @param {number[]} pokemonIds - Array of Pokémon IDs.
 * @param {function} callback - Callback function(err, maxPokemonMap).
 */
const getMaxPokemonData = (db, pokemonIds, callback) => {
    if (pokemonIds.length === 0) {
        // If no Pokémon IDs are provided, return an empty map
        return callback(null, {});
    }

    // Create placeholders for parameterized query
    const placeholders = pokemonIds.map(() => '?').join(', ');
    const query = `SELECT * FROM max_pokemon WHERE pokemon_id IN (${placeholders})`;

    // Execute the query
    db.all(query, pokemonIds, (err, rows) => {
        if (err) {
            logger.error(`Error fetching max_pokemon data: ${err.message}`);
            return callback(err);
        }

        // Group the rows by pokemon_id
        const maxPokemonMap = {};
        rows.forEach(row => {
            if (!maxPokemonMap[row.pokemon_id]) {
                maxPokemonMap[row.pokemon_id] = [];
            }
            maxPokemonMap[row.pokemon_id].push(row);
        });

        callback(null, maxPokemonMap);
    });
};

/**
 * Appends the max_pokemon data as a 'max' array to each Pokémon object.
 * 
 * @param {sqlite3.Database} db - The SQLite database instance.
 * @param {Object[]} pokemons - Array of Pokémon objects.
 * @param {function} callback - Callback function(err, updatedPokemons).
 */
const appendMaxDataToPokemons = (db, pokemons, callback) => {
    const pokemonIds = pokemons.map(p => p.pokemon_id);
    getMaxPokemonData(db, pokemonIds, (err, maxPokemonMap) => {
        if (err) {
            return callback(err);
        }

        // Append the max data to each Pokémon object
        const updatedPokemons = pokemons.map(pokemon => ({
            ...pokemon,
            max: maxPokemonMap[pokemon.pokemon_id] || []
        }));

        callback(null, updatedPokemons);
    });
};

module.exports = {
    appendMaxDataToPokemons
};
