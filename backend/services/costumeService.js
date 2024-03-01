function getCostumesForPokemon(db, callback) {
    const costumeQuery = "SELECT * FROM costume_pokemon";

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
            image_url: c.image_url_costume, // Directly using the URL from the database
            image_url_shiny: c.image_url_shiny_costume, // Directly using the URL from the database
            shiny_available: c.shiny_available,
            date_available: c.date_available,
            date_shiny_available: c.date_shiny_available
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
