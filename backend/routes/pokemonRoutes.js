const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('D:/Visual-Studio-Code/Go/backend/data/pokego.db');

router.get('/api/pokemons', (req, res) => {
    // Your initial query gets all available pokemons and their basic details.
    const query = "SELECT * FROM pokemon WHERE available = 1 ORDER BY pokedex_number ASC"; 

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const pokemonsWithImages = rows.map(pokemon => {
            const regularImagePath = `/images/default/pokemon_${pokemon.pokemon_id}.png`;
            const shinyImagePath = `/images/shiny/shiny_pokemon_${pokemon.pokemon_id}.png`;
                
            return {
                ...pokemon,
                image: regularImagePath,
                shiny_image: shinyImagePath,
                costumes: []  // We'll fill this array in the next step.
            }
        });

        // Fetch costume data separately and attach it to the related Pokemon.
        const costumeQuery = "SELECT * FROM costume_pokemon";
        
        db.all(costumeQuery, [], (err, costumes) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Now, we loop through all pokemons and attach their respective costumes.
            const pokemonsWithCostumes = pokemonsWithImages.map(pokemon => {
                // Find related costumes for the current pokemon.
                const relatedCostumes = costumes.filter(c => c.pokemon_id === pokemon.pokemon_id);
                
                // Format costume paths and add them to the pokemon data.
                const formattedCostumes = relatedCostumes.map(c => ({
                    name: c.costume_name,
                    image: `/images/costumes/pokemon_${c.pokemon_id}_${c.costume_name}_default.png`,
                    shiny_image: `/images/costumes_shiny/pokemon_${c.pokemon_id}_${c.costume_name}_shiny.png`
                }));
                
                return {
                    ...pokemon,
                    costumes: formattedCostumes
                };
            });

            // Respond with the pokemon data enriched with costume paths.
            res.json(pokemonsWithCostumes);
        });
    });
});


module.exports = router;
