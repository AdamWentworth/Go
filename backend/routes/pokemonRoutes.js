const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('D:/Visual-Studio-Code/Go/backend/data/pokego.db');

router.get('/api/pokemons', (req, res) => {
    const query = `
    SELECT 
        pokemon.*,
        t1.name AS type1_name, 
        t2.name AS type2_name 
    FROM pokemon 
    LEFT JOIN types AS t1 ON pokemon.type_1_id = t1.type_id 
    LEFT JOIN types AS t2 ON pokemon.type_2_id = t2.type_id 
    WHERE available = 1 
    ORDER BY pokedex_number ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const pokemonsWithImages = rows.map(pokemon => {
            const regularImagePath = `/images/default/pokemon_${pokemon.pokemon_id}.png`;
            const shinyImagePath = `/images/shiny/shiny_pokemon_${pokemon.pokemon_id}.png`;

            let pokemonData = {
                ...pokemon,
                image: regularImagePath,
                shiny_image: shinyImagePath,
                costumes: [],  // We'll fill this array in the next step.
                type_1_icon: pokemon.type1_name ? `/images/types/${pokemon.type1_name.toLowerCase()}.png` : null,
                type_2_icon: pokemon.type2_name ? `/images/types/${pokemon.type2_name.toLowerCase()}.png` : null,
            };

            // If form attribute is not null, add it to the data.
            if (pokemon.form) {
                pokemonData = {
                    ...pokemonData,
                    form: pokemon.form
                };
            }

            return pokemonData;
        });

        const costumeQuery = "SELECT * FROM costume_pokemon";

        db.all(costumeQuery, [], (err, costumes) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const pokemonsWithCostumes = pokemonsWithImages.map(pokemon => {
                const relatedCostumes = costumes.filter(c => c.pokemon_id === pokemon.pokemon_id);

                const formattedCostumes = relatedCostumes.map(c => ({
                    costume_id: c.costume_id,
                    name: c.costume_name,
                    image: `/images/costumes/pokemon_${c.pokemon_id}_${c.costume_name}_default.png`,
                    shiny_image: `/images/costumes_shiny/pokemon_${c.pokemon_id}_${c.costume_name}_shiny.png`,
                    shiny_available: c.shiny_available  // Add the shiny_available value from the costume_pokemon table
                }));                

                return {
                    ...pokemon,
                    costumes: formattedCostumes
                };
            });

            res.json(pokemonsWithCostumes);
        });
    });
});

module.exports = router;
