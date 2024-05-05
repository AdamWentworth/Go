// movesService.js

const getMovesForPokemon = (db, callback) => {
    const movesQuery = `
    SELECT 
        m.*,
        t.name as type_name,
        pm.legacy
    FROM moves m
    JOIN types t ON m.type_id = t.type_id
    JOIN pokemon_moves pm ON m.move_id = pm.move_id`;

    db.all(movesQuery, [], (err, allMoves) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, allMoves);
        }
    });
};

const formatMoves = (pokemons, allMoves, pokemonMoves) => {
    return pokemons.map(pokemon => {
        const relatedPokemonMoves = pokemonMoves.filter(pm => pm.pokemon_id === pokemon.pokemon_id);
        const moves = relatedPokemonMoves.map(pm => {
            const move = allMoves.find(m => m.move_id === pm.move_id);
            return move ? {
                ...move,
                type: move.type_name.toLowerCase(),
                legacy: pm.legacy === 1
            } : null;
        }).filter(Boolean);
        return {
            ...pokemon,
            moves
        };
    });
};

module.exports = {
    getMovesForPokemon,
    formatMoves
};
