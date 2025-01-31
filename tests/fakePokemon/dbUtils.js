// dbUtils.js

const mysql = require('mysql2/promise');

// Function to check if a username already exists in MySQL
async function usernameExists(connection, username) {
    const [rows] = await connection.execute(
        `SELECT COUNT(*) AS count FROM users WHERE username = ?`,
        [username]
    );
    return rows[0].count > 0;
}

// Updated function to use MongoDB coordinates directly
async function insertUser(connection, mongoUser) {
    // Get coordinates directly from the mongoUser object
    const latitude = mongoUser.coordinates?.latitude || null;
    const longitude = mongoUser.coordinates?.longitude || null;

    console.log(`Inserting user: ${mongoUser.username}, Latitude: ${latitude}, Longitude: ${longitude}`);

    const [rows] = await connection.execute(
        `INSERT INTO users (user_id, username, latitude, longitude) VALUES (?, ?, ?, ?)`,
        [mongoUser._id.toString(), mongoUser.username, latitude, longitude]
    );
    return rows;
}

// Function to insert a Pokémon instance into MySQL
async function insertPokemonInstance(connection, instance) {
    const values = [
        instance.instance_id,
        instance.pokemon_id,
        instance.nickname || null,
        instance.cp || null,
        instance.attack_iv || 0,
        instance.defense_iv || 0,
        instance.stamina_iv || 0,
        instance.shiny,
        instance.costume_id || null,
        instance.lucky || 0,
        instance.shadow,
        instance.purified || 0,
        instance.fast_move_id || null,
        instance.charged_move1_id || null,
        instance.charged_move2_id || null,
        instance.weight || null,
        instance.height || null,
        instance.gender || null,
        instance.mirror || 0,
        instance.pref_lucky || 0,
        instance.registered || 0,
        instance.favorite || 0,
        instance.location_card || null,
        instance.location_caught || null,
        instance.friendship_level || null,
        instance.date_caught || null,
        instance.date_added || new Date(),
        instance.last_update || Date.now(),
        instance.is_unowned,
        instance.is_owned,
        instance.is_for_trade,
        instance.is_wanted,
        instance.not_trade_list || '{}',
        instance.not_wanted_list || '{}',
        instance.trace_id || null,
        instance.user_id,
        instance.trade_filters || '{}',
        instance.wanted_filters || '{}',
        instance.mega || 0,
        instance.mega_form || null,
        instance.is_mega || 0,
        instance.level,
        instance.is_fused || 0,
        instance.fusion || {},
        instance.fusion_form || null,
        instance.fused_with || null,
        instance.disabled || 0,
        instance.dynamax,
        instance.gigantamax,
        instance.max_attack || null,
        instance.max_guard || null,
        instance.max_spirit || null
    ];

    const query = `INSERT INTO instances (
        instance_id, pokemon_id, nickname, cp, attack_iv, defense_iv, stamina_iv, 
        shiny, costume_id, lucky, shadow, purified, fast_move_id, charged_move1_id, 
        charged_move2_id, weight, height, gender, mirror, pref_lucky, registered, 
        favorite, location_card, location_caught, friendship_level, date_caught, 
        date_added, last_update, is_unowned, is_owned, is_for_trade, is_wanted, 
        not_trade_list, not_wanted_list, trace_id, user_id, trade_filters, wanted_filters,
        mega, mega_form, is_mega, level, is_fused, fusion, fusion_form, fused_with, 
        disabled, dynamax, gigantamax, max_attack, max_guard, max_spirit
    ) VALUES (${Array(values.length).fill('?').join(',')})`;

    const [rows] = await connection.execute(query, values);
    return rows;
}

module.exports = {
    usernameExists,
    insertUser,
    insertPokemonInstance
};
