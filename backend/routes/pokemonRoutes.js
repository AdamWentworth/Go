const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('D:/Visual-Studio-Code/Go/backend/data/pokego.db');

router.get('/api/pokemons', (req, res) => {
    const query = `
    SELECT 
        pokemon.*,
        t1.name AS type1_name, 
        t2.name AS type2_name,
        sp.shiny_available AS shadow_shiny_available,
        sp.apex AS shadow_apex
    FROM pokemon 
    LEFT JOIN types AS t1 ON pokemon.type_1_id = t1.type_id 
    LEFT JOIN types AS t2 ON pokemon.type_2_id = t2.type_id 
    LEFT JOIN shadow_pokemon AS sp ON pokemon.pokemon_id = sp.pokemon_id
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

            let shadowImagePath = null;
            let shinyShadowImagePath = null;

            // If pokemon exists in shadow_pokemon table
            if (pokemon.shadow_shiny_available !== null || pokemon.shadow_apex !== null) {
                shadowImagePath = `/images/shadow/shadow_pokemon_${pokemon.pokemon_id}.png`;
                shinyShadowImagePath = `/images/shiny_shadow/shiny_shadow_pokemon_${pokemon.pokemon_id}.png`;
            }

            let pokemonData = {
                ...pokemon,
                image: regularImagePath,
                shiny_image: shinyImagePath,
                shadow_image: shadowImagePath,
                shiny_shadow_image: shinyShadowImagePath,
                costumes: [],
                type_1_icon: pokemon.type1_name ? `/images/types/${pokemon.type1_name.toLowerCase()}.png` : null,
                type_2_icon: pokemon.type2_name ? `/images/types/${pokemon.type2_name.toLowerCase()}.png` : null,
                shadow_shiny_available: pokemon.shadow_shiny_available,
                shadow_apex: pokemon.shadow_apex
            };

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
                    shiny_available: c.shiny_available
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
