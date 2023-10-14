const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('D:/Visual-Studio-Code/Go/backend/data/pokego.db');

router.get('/api/pokemons', (req, res) => {
    
    // SQL query to fetch all Pokémon details
    const query = "SELECT * FROM pokemon";

    db.all(query, [], (err, rows) => {
        if (err) {
            // Send a 500 error if there's an issue querying the database
            res.status(500).json({ error: err.message });
            return;
        }

        // Generate image paths for each Pokémon based on their pokemon_id
        const pokemonsWithImages = rows.map(pokemon => {
            return {
                ...pokemon,
                image: `/images/default/pokemon_${pokemon.pokemon_id}.png`
            }
        });

        // Send the Pokémon details and image paths as the response
        res.json(pokemonsWithImages);
    });
});

module.exports = router;
