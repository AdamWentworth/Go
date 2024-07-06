const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const logger = require('../middlewares/logger'); // Import the logger
const { getPokemonsFromDb } = require('../services/pokemonService');
const { getEvolutionsFromDb, buildEvolutionMap } = require('../services/evolutionsService');
const { getImagePathsForPokemon } = require('../utils/imagePaths');
const { getCostumesForPokemon, formatCostumes } = require('../services/costumeService');
const { getMovesForPokemon, formatMoves } = require('../services/movesService');

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

                    // Get evolutions and add them to the response
                    getEvolutionsFromDb((err, evolutionMap) => {
                        if (err) {
                            logger.error(`Error fetching evolution data: ${err.message}`);
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        const pokemonsWithEvolutions = pokemonsWithAllData.map(pokemon => {
                            const evolutionData = evolutionMap[pokemon.pokemon_id];
                            if (evolutionData) {
                                return {
                                    ...pokemon,
                                    evolves_from: evolutionData.evolves_from,
                                    evolves_to: evolutionData.evolves_to,
                                };
                            }
                            return pokemon;
                        });

                        res.json(pokemonsWithEvolutions);
                        logger.info(`Returned data for /api/pokemons with status ${res.statusCode}`);
                    });
                });
            });
        });
    });
});

module.exports = router;
