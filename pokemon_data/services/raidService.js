// raidService.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/pokego.db');

const getRaidBossData = (callback) => {
    const query = `
    SELECT * FROM raid_bosses
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            callback(err);
        } else {
            const raidBossData = rows.reduce((acc, row) => {
                if (!acc[row.pokemon_id]) {
                    acc[row.pokemon_id] = [];
                }
                acc[row.pokemon_id].push(row);
                return acc;
            }, {});
            callback(null, raidBossData);
        }
    });
};

module.exports = {
    getRaidBossData,
};
