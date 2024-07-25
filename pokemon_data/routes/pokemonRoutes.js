const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const async = require('async'); // Ensure async is installed using npm
const logger = require('../middlewares/logger'); // Import the logger
const { getPokemonsFromDb } = require('../services/pokemonService');
const { getEvolutionsFromDb } = require('../services/evolutionsService');
const { getImagePathsForPokemon } = require('../utils/imagePaths');
const { getCostumesForPokemon, formatCostumes } = require('../services/costumeService');
const { getMovesForPokemon, formatMoves } = require('../services/movesService');
const { formatFusionData } = require('../services/fusionService');
const { getBackgroundsForPokemon } = require('../services/backgroundService'); // Import the background service
const { getCpForPokemon } = require('../services/cpService');

const db = new sqlite3.Database('./data/pokego.db');

router.get('/pokemon/pokemons', (req, res) => {
    getPokemonsFromDb((err, rows) => {
        if (err) {
            logger.error(`Error fetching pokemons from DB: ${err.message}`);
            res.status(500).json({ error: err.message });
            return;
        }

        const pokemonsWithImages = rows.map(getImagePathsForPokemon);

        getCostumesForPokemon(db, (err, costumes) => {
            if (err) {
                logger.error(`Error fetching costumes for pokemons: ${err.message}`);
                res.status(500).json({ error: err.message });
                return;
            }

            const pokemonsWithCostumes = formatCostumes(pokemonsWithImages, costumes);
            
            getMovesForPokemon(db, (err, allMoves) => {
                if (err) {
                    logger.error(`Error fetching moves for pokemons: ${err.message}`);
                    res.status(500).json({ error: err.message });
                    return;
                }

                const pokemonMovesQuery = "SELECT * FROM pokemon_moves";
            
                db.all(pokemonMovesQuery, [], (err, pokemonMoves) => {
                    if (err) {
                        logger.error(`Error querying pokemon_moves: ${err.message}`);
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    const pokemonsWithAllData = formatMoves(pokemonsWithCostumes, allMoves, pokemonMoves);

                    const pokemonsWithFusionData = formatFusionData(pokemonsWithAllData);

                    getBackgroundsForPokemon((err, backgroundMap) => {
                        if (err) {
                            logger.error(`Error fetching backgrounds for pokemons: ${err.message}`);
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        const pokemonsWithBackgrounds = pokemonsWithFusionData.map(pokemon => {
                            const backgrounds = backgroundMap[pokemon.pokemon_id] || [];
                            return {
                                ...pokemon,
                                backgrounds: backgrounds.map(background => ({
                                    ...background,
                                    costume_id: background.costume_id || null // Ensure costume_id is included
                                }))
                            };
                        });

                        // Attach CP data for level 40 and 50
                        async.map(pokemonsWithBackgrounds, (pokemon, callback) => {
                            getCpForPokemon(pokemon.pokemon_id, (err, cpData) => {
                                if (err) {
                                    callback(err);
                                } else {
                                    const cpDetails = cpData.reduce((acc, data) => {
                                        acc[`cp${data.level_id}`] = data.cp;
                                        return acc;
                                    }, {});
                                    callback(null, { ...pokemon, ...cpDetails });
                                }
                            });
                        }, (err, finalPokemons) => {
                            if (err) {
                                logger.error(`Error fetching CP data for pokemons: ${err.message}`);
                                res.status(500).json({ error: err.message });
                            } else {
                                // Get evolutions and add them to the response
                                getEvolutionsFromDb((err, evolutionMap) => {
                                    if (err) {
                                        logger.error(`Error fetching evolution data: ${err.message}`);
                                        res.status(500).json({ error: err.message });
                                        return;
                                    }

                                    const pokemonsWithEvolutions = finalPokemons.map(pokemon => {
                                        const evolutionData = evolutionMap[pokemon.pokemon_id];
                                        return evolutionData ? { ...pokemon, ...evolutionData } : pokemon;
                                    });

                                    res.json(pokemonsWithEvolutions);
                                    logger.info(`Returned data for /pokemons with status ${res.statusCode}`);
                                });
                            }
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
