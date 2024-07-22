// backgroundService.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/pokego.db');

const getBackgroundsForPokemon = (callback) => {
    const query = `
    SELECT 
        pb.pokemon_id,
        pb.costume_id,
        b.background_id,
        b.name,
        b.location,
        b.image_url,
        b.date
    FROM pokemon_backgrounds pb
    INNER JOIN backgrounds b ON pb.background_id = b.background_id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            callback(err, null);
            return;
        }

        const backgroundMap = rows.reduce((acc, row) => {
            if (!acc[row.pokemon_id]) {
                acc[row.pokemon_id] = [];
            }
            acc[row.pokemon_id].push({
                background_id: row.background_id,
                name: row.name,
                location: row.location,
                image_url: row.image_url,
                date: row.date,
                costume_id: row.costume_id // Include costume_id in the background data
            });
            return acc;
        }, {});

        callback(null, backgroundMap);
    });
};

module.exports = {
    getBackgroundsForPokemon
};
