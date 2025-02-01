// services/sizesService.js
const logger = require('../middlewares/logger');

const getSizesForPokemon = (db, pokemonId, callback) => {
    const query = `
        SELECT 
            pokedex_height,
            pokedex_weight,
            height_standard_deviation,
            weight_standard_deviation,
            height_xxs_threshold,
            height_xs_threshold,
            height_xl_threshold,
            height_xxl_threshold,
            weight_xxs_threshold,
            weight_xs_threshold,
            weight_xl_threshold,
            weight_xxl_threshold
        FROM pokemon_sizes 
        WHERE pokemon_id = ?
    `;

    db.get(query, [pokemonId], (err, row) => {
        if (err) {
            logger.error(`Error fetching sizes for pokemon ${pokemonId}: ${err.message}`);
            return callback(err);
        }
        callback(null, row);
    });
};

const appendSizesToPokemons = (db, pokemons, callback) => {
    const async = require('async');

    async.map(
        pokemons,
        (pokemon, mapCallback) => {
            getSizesForPokemon(db, pokemon.pokemon_id, (err, sizeData) => {
                if (err) return mapCallback(err);

                // If no size data found, return pokemon without modification
                if (!sizeData) {
                    return mapCallback(null, pokemon);
                }

                // Add size data to pokemon object
                return mapCallback(null, {
                    ...pokemon,
                    sizes: sizeData
                });
            });
        },
        (err, pokemonsWithSizes) => {
            if (err) {
                logger.error(`Error appending sizes to pokemons: ${err.message}`);
                return callback(err);
            }
            callback(null, pokemonsWithSizes);
        }
    );
};

module.exports = {
    getSizesForPokemon,
    appendSizesToPokemons
};