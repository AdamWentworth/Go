const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('D:/Visual-Studio-Code/Go/backend/data/pokego.db');

router.get('/api/pokemons', (req, res) => {
    
    // SQL query to fetch all available Pokémon details and order them by pokedex_number
    const query = "SELECT * FROM pokemon WHERE available = 1 ORDER BY pokedex_number";

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

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
