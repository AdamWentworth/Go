const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { getPokemonsFromDb } = require('../services/pokemonService');
const { getEvolutionsFromDb, buildEvolutionMap } = require('../services/evolutionsService'); // Import evolutions service
const { getImagePathsForPokemon } = require('../utils/imagePaths');
const { getCostumesForPokemon, formatCostumes } = require('../services/costumeService');
const { getMovesForPokemon, formatMoves } = require('../services/movesService');

const db = new sqlite3.Database('./data/pokego.db');

router.get('/api/pokemons', (req, res) => {
    getPokemonsFromDb((err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const pokemonsWithImages = rows.map(getImagePathsForPokemon);

        getCostumesForPokemon(db, (err, costumes) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const pokemonsWithCostumes = formatCostumes(pokemonsWithImages, costumes);
            
            getMovesForPokemon(db, (err, allMoves) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                const pokemonMovesQuery = "SELECT * FROM pokemon_moves";
            
                db.all(pokemonMovesQuery, [], (err, pokemonMoves) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    const pokemonsWithAllData = formatMoves(pokemonsWithCostumes, allMoves, pokemonMoves);

                    // Get evolutions and add them to the response
                    getEvolutionsFromDb((err, evolutionMap) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        // No need to call buildEvolutionMap since evolutionMap is already provided by getEvolutionsFromDb

                        // Add evolution data to each pokemon
                        const pokemonsWithEvolutions = pokemonsWithAllData.map(pokemon => {
                            const evolutionData = evolutionMap[pokemon.pokemon_id];
                            // Spread the evolution data if it exists
                            if (evolutionData) {
                                return {
                                    ...pokemon,
                                    evolves_from: evolutionData.evolves_from, // This is now an array
                                    evolves_to: evolutionData.evolves_to, // This is now an array
                                };
                            }
                            // Otherwise, just return the pokemon data
                            return pokemon;
                        });

                        res.json(pokemonsWithEvolutions);
                    });
                });
            });
        });
    });
});


module.exports = router;
