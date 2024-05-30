function getCostumesForPokemon(db, callback) {
    const costumeQuery = `
        SELECT cp.*, scp.date_available as shadow_date_available, scp.date_shiny_available as shadow_date_shiny_available, 
               scp.image_url_shadow_costume, scp.image_url_shiny_shadow_costume
        FROM costume_pokemon cp
        LEFT JOIN shadow_costume_pokemon scp ON cp.costume_id = scp.costume_id`;

    db.all(costumeQuery, [], (err, costumes) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, costumes);
        }
    });
}

function formatCostumes(pokemonsWithImages, costumes) {
    return pokemonsWithImages.map(pokemon => {
        const relatedCostumes = costumes.filter(c => c.pokemon_id === pokemon.pokemon_id);

        const formattedCostumes = relatedCostumes.map(c => ({
            costume_id: c.costume_id,
            name: c.costume_name,
            image_url: c.image_url_costume,
            image_url_shiny: c.image_url_shiny_costume,
            shiny_available: c.shiny_available,
            date_available: c.date_available,
            date_shiny_available: c.date_shiny_available,
            shadow_costume: c.image_url_shadow_costume ? {
                date_available: c.shadow_date_available,
                date_shiny_available: c.shadow_date_shiny_available,
                image_url_shadow_costume: c.image_url_shadow_costume,
                image_url_shiny_shadow_costume: c.image_url_shiny_shadow_costume
            } : null  // Only add shadow costume object if the data exists
        }));

        return {
            ...pokemon,
            costumes: formattedCostumes
        };
    });
}

module.exports = {
    getCostumesForPokemon,
    formatCostumes
};
