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
            image: `/images/costumes/pokemon_${c.pokemon_id}_${c.costume_name}_default.png`,
            shiny_image: `/images/costumes_shiny/pokemon_${c.pokemon_id}_${c.costume_name}_shiny.png`,
            shiny_available: c.shiny_available
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
