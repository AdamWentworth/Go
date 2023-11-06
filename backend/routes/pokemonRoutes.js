const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { getPokemonsFromDb } = require('../services/pokemonService');
const { getImagePathsForPokemon } = require('../utils/imagePaths');
const { getCostumesForPokemon, formatCostumes } = require('../services/costumeService');
const { getMovesForPokemon, formatMoves } = require('../services/movesService');

const db = new sqlite3.Database('D:/Visual-Studio-Code/Go/backend/data/pokego.db');

router.get('/api/pokemons', (req, res) => {
    getPokemonsFromDb((err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Use the utility function to construct image paths
        const pokemonsWithImages = rows.map(getImagePathsForPokemon);

        // Fetch costumes and format them using the service function
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
            
                // Now we need to fetch the pokemon_moves
                const pokemonMovesQuery = "SELECT * FROM pokemon_moves";
            
                db.all(pokemonMovesQuery, [], (err, pokemonMoves) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
            
                    const pokemonsWithAllData = formatMoves(pokemonsWithCostumes, allMoves, pokemonMoves);
            
                    res.json(pokemonsWithAllData);
                });
            });
        });
    });
});

module.exports = router;
