// pokemonRoutes.js

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const async = require('async');
const logger = require('../middlewares/logger');
const { getPokemonsFromDb } = require('../services/pokemonService');
const { getEvolutionsFromDb } = require('../services/evolutionsService');
const { getImagePathsForPokemon } = require('../utils/imagePaths');
const { getCostumesForPokemon, formatCostumes } = require('../services/costumeService');
const { getMovesForPokemon, formatMoves } = require('../services/movesService');
const { getAllFusions, formatFusionData } = require('../services/fusionService');
const { getBackgroundsForPokemon } = require('../services/backgroundService');
const { 
    getCpForPokemon, 
    getCpForMegaEvolution,
    getCpForFusionPokemon
} = require('../services/cpService');
const { getMegaEvolutionsForPokemon } = require('../services/megaService');
const { getRaidBossData } = require('../services/raidService');
const { appendMaxDataToPokemons } = require('../services/maxPokemonService');
const { appendSizesToPokemons } = require('../services/sizesService');

const { writeJsonToFile } = require('../utils/jsonWriter');

const db = new sqlite3.Database('./data/pokego.db');

router.get('/pokemon/pokemons', (req, res) => {
    getPokemonsFromDb((err, rows) => {
        if (err) {
            logger.error(`Error fetching pokemons from DB: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }

        const pokemonsWithImages = rows.map(getImagePathsForPokemon);

        // Filter Pokémon with female_unique = 1
        const femaleUniquePokemons = pokemonsWithImages.filter(p => p.female_unique === 1);
        const femalePokemonIds = femaleUniquePokemons.map(p => p.pokemon_id);

        if (femalePokemonIds.length > 0) {
            const femalePokemonQuery = `
                SELECT * FROM female_pokemon WHERE pokemon_id IN (${femalePokemonIds.join(', ')})
            `;
            db.all(femalePokemonQuery, [], (err, femalePokemonRows) => {
                if (err) {
                    logger.error(`Error fetching female Pokémon data: ${err.message}`);
                    return res.status(500).json({ error: err.message });
                }

                // Map female data
                const femalePokemonMap = {};
                femalePokemonRows.forEach(femaleData => {
                    femalePokemonMap[femaleData.pokemon_id] = femaleData;
                });

                // Attach female_data to the relevant Pokémon objects
                const pokemonsWithFemaleData = pokemonsWithImages.map(pokemon => {
                    if (pokemon.female_unique === 1 && femalePokemonMap[pokemon.pokemon_id]) {
                        return {
                            ...pokemon,
                            female_data: femalePokemonMap[pokemon.pokemon_id],
                        };
                    }
                    return pokemon;
                });

                // Continue processing
                processAdditionalPokemonData(pokemonsWithFemaleData, res);
            });
        } else {
            // If no Pokémon has female_unique set to 1, just continue
            processAdditionalPokemonData(pokemonsWithImages, res);
        }
    });
});

const processAdditionalPokemonData = (pokemons, res) => {
    getCostumesForPokemon(db, (err, costumes) => {
        if (err) {
            logger.error(`Error fetching costumes for pokemons: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }

        const pokemonsWithCostumes = formatCostumes(pokemons, costumes);

        getMovesForPokemon(db, (err, allMoves) => {
            if (err) {
                logger.error(`Error fetching moves for pokemons: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }

            const pokemonMovesQuery = "SELECT * FROM pokemon_moves";
            db.all(pokemonMovesQuery, [], (err, pokemonMoves) => {
                if (err) {
                    logger.error(`Error querying pokemon_moves: ${err.message}`);
                    return res.status(500).json({ error: err.message });
                }

                const pokemonsWithAllData = formatMoves(
                    pokemonsWithCostumes, 
                    allMoves, 
                    pokemonMoves
                );

                // Use service function to get all fusion data
                getAllFusions((err, fusionRows) => {
                    if (err) {
                        logger.error(`Error fetching fusion data: ${err.message}`);
                        return res.status(500).json({ error: err.message });
                    }

                    // Attach basic fusion data
                    const pokemonsWithFusionData = formatFusionData(pokemonsWithAllData, fusionRows);

                    // --- NEW PART: Attach CP for each Fusion entry ---
                    async.map(
                        pokemonsWithFusionData,
                        (pokemon, mapCallback) => {
                            // If this Pokémon has no fusions, skip
                            if (!pokemon.fusion || pokemon.fusion.length === 0) {
                                return mapCallback(null, pokemon);
                            }

                            // Otherwise, attach CP to each Fusion
                            async.map(
                                pokemon.fusion,
                                (fusion, fusionCallback) => {
                                    // fusion.fusion_id or fusion.id? Adjust depending on how formatFusionData structures it:
                                    getCpForFusionPokemon(fusion.fusion_id, (err, cpData) => {
                                        if (err) return fusionCallback(err);

                                        const cpDetails = cpData.reduce((acc, data) => {
                                            acc[`cp${data.level_id}`] = data.cp;
                                            return acc;
                                        }, {});

                                        // Merge CP info into the fusion object
                                        fusionCallback(null, { ...fusion, ...cpDetails });
                                    });
                                },
                                (err, updatedFusions) => {
                                    if (err) return mapCallback(err);

                                    // Return the Pokémon with updated fusions
                                    mapCallback(null, { ...pokemon, fusion: updatedFusions });
                                }
                            );
                        },
                        (err, pokemonsWithFusionCP) => {
                            if (err) {
                                logger.error(`Error attaching Fusion CP: ${err.message}`);
                                return res.status(500).json({ error: err.message });
                            }

                            // Now proceed with backgrounds
                            getBackgroundsForPokemon((err, backgroundMap) => {
                                if (err) {
                                    logger.error(`Error fetching backgrounds for pokemons: ${err.message}`);
                                    return res.status(500).json({ error: err.message });
                                }

                                const pokemonsWithBackgrounds = pokemonsWithFusionCP.map(pokemon => {
                                    const backgrounds = backgroundMap[pokemon.pokemon_id] || [];
                                    return {
                                        ...pokemon,
                                        backgrounds: backgrounds.map(bg => ({
                                            ...bg,
                                            costume_id: bg.costume_id || null
                                        }))
                                    };
                                });

                                // Attach CP for each Pokémon (base forms) for levels 40 & 50
                                async.map(
                                    pokemonsWithBackgrounds,
                                    (pokemon, callback) => {
                                        getCpForPokemon(pokemon.pokemon_id, (err, cpData) => {
                                            if (err) {
                                                return callback(err);
                                            }
                                            const cpDetails = cpData.reduce((acc, data) => {
                                                acc[`cp${data.level_id}`] = data.cp;
                                                return acc;
                                            }, {});
                                            callback(null, { ...pokemon, ...cpDetails });
                                        });
                                    },
                                    (err, finalPokemons) => {
                                        if (err) {
                                            logger.error(`Error fetching CP data for pokemons: ${err.message}`);
                                            return res.status(500).json({ error: err.message });
                                        }

                                        // Get evolutions and add them to the response
                                        getEvolutionsFromDb((err, evolutionMap) => {
                                            if (err) {
                                                logger.error(`Error fetching evolution data: ${err.message}`);
                                                return res.status(500).json({ error: err.message });
                                            }

                                            const pokemonsWithEvolutions = finalPokemons.map(pokemon => {
                                                const evolutionData = evolutionMap[pokemon.pokemon_id];
                                                return evolutionData
                                                    ? { ...pokemon, ...evolutionData }
                                                    : pokemon;
                                            });

                                            // Now handle Mega Evolutions (with CP)
                                            async.map(
                                                pokemonsWithEvolutions,
                                                (pokemon, callback) => {
                                                    getMegaEvolutionsForPokemon(pokemon.pokemon_id, (err, megaEvolutions) => {
                                                        if (err) return callback(err);

                                                        async.map(
                                                            megaEvolutions,
                                                            (megaEvolution, megaCallback) => {
                                                                getCpForMegaEvolution(megaEvolution.id, (err, cpData) => {
                                                                    if (err) return megaCallback(err);

                                                                    const cpDetails = cpData.reduce((acc, data) => {
                                                                        acc[`cp${data.level_id}`] = data.cp;
                                                                        return acc;
                                                                    }, {});
                                                                    megaCallback(null, { ...megaEvolution, ...cpDetails });
                                                                });
                                                            },
                                                            (err, megaEvolutionsWithCp) => {
                                                                if (err) return callback(err);
                                                                callback(null, {
                                                                    ...pokemon,
                                                                    megaEvolutions: megaEvolutionsWithCp
                                                                });
                                                            }
                                                        );
                                                    });
                                                },
                                                (err, pokemonsWithMegaEvolutions) => {
                                                    if (err) {
                                                        logger.error(`Error fetching mega evolutions: ${err.message}`);
                                                        return res.status(500).json({ error: err.message });
                                                    }

                                                    // Finally, attach Raid Boss data
                                                    getRaidBossData((err, raidBossData) => {
                                                        if (err) {
                                                            logger.error(`Error fetching raid boss data: ${err.message}`);
                                                            return res.status(500).json({ error: err.message });
                                                        }

                                                        const pokemonsWithRaidBossData = pokemonsWithMegaEvolutions.map(pokemon => {
                                                            const raidBossEntries = raidBossData[pokemon.pokemon_id] || [];
                                                            return { ...pokemon, raid_boss: raidBossEntries };
                                                        });

                                                        // --- NEW PART: Append max_pokemon data ---
                                                        appendMaxDataToPokemons(db, pokemonsWithRaidBossData, (err, pokemonsWithMaxData) => {
                                                            if (err) {
                                                                logger.error(`Error appending max_pokemon data: ${err.message}`);
                                                                return res.status(500).json({ error: err.message });
                                                            }

                                                            appendSizesToPokemons(db, pokemonsWithRaidBossData, (err, pokemonsWithSizes) => {
                                                                if (err) {
                                                                    logger.error(`Error appending size data: ${err.message}`);
                                                                    return res.status(500).json({ error: err.message });
                                                                }
                                                            
                                                                // Now append max data to the pokemons that have sizes
                                                                appendMaxDataToPokemons(db, pokemonsWithSizes, (err, finalPokemons) => {
                                                                    if (err) {
                                                                        logger.error(`Error appending max_pokemon data: ${err.message}`);
                                                                        return res.status(500).json({ error: err.message });
                                                                    }
                                                            
                                                                    // Send the final response with all data
                                                                    res.json(finalPokemons);
                                                                    logger.info(`Returned data for /pokemons with status ${res.statusCode}`);
                                                                });
                                                            });
                                                        });
                                                    });
                                                }
                                            );
                                        });
                                    }
                                );
                            });
                        }
                    );
                });
            });
        });
    });
};

module.exports = router;
