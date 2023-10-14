const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('D:/Visual-Studio-Code/Go/backend/data/pokego.db');

router.get('/api/pokemons', (req, res) => {
    let query = "SELECT * FROM pokemon WHERE available = 1";
    const params = [];
    
    // Checking if 'name' query parameter is provided to filter the Pokémon.
    if (req.query.name) {
        query += " AND name LIKE ?";
        params.push(`%${req.query.name}%`);
    }

    console.log('Query name:', req.query.name);

    // Ensuring results are always ordered by 'pokedex_number'.
    query += " ORDER BY pokedex_number ASC"; 

    db.all(query, params, (err, rows) => {
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

        res.json(pokemonsWithImages);
    });
});


module.exports = router;
