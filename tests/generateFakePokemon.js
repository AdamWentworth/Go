const mongoose = require('../authentication/middlewares/mongoose');
const mysql = require('mysql2/promise');
const { faker } = require('@faker-js/faker');
const fs = require('fs');

// MongoDB user model
const User = require('../authentication/models/user'); // Adjust the path to your User model

// MySQL connection configuration
const mysqlConfig = {
    host: 'localhost',
    user: 'adam',
    password: 'REMOVED_PASSWORD',
    database: 'user_pokemon_management'
};

// Load Pokémon data from JSON file
const pokemonData = JSON.parse(fs.readFileSync('./pokemon.json', 'utf8'));

// Helper function to generate random coordinates within Vancouver
function getRandomVancouverCoordinates() {
    // Vancouver latitude ranges approximately from 49.198 to 49.316
    // Vancouver longitude ranges approximately from -123.264 to -123.023
    const latitude = faker.number.float({ min: 49.198, max: 49.316, precision: 0.00001 });
    const longitude = faker.number.float({ min: -123.264, max: -123.023, precision: 0.00001 });
    return { latitude, longitude };
}

// Function to get a random Pokémon from the JSON data
function getRandomPokemon() {
    return pokemonData[Math.floor(Math.random() * pokemonData.length)];
}

// Helper function to generate a Pokémon instance for a user
function generatePokemonInstance(pokemon, userId) {
    const canBeShiny = pokemon.shiny_available === 1;
    const canBeShadow = pokemon.date_shadow_available ? true : false;
    const canBeShinyShadow = pokemon.shadow_shiny_available === 1;

    let isShiny = 0;
    let isShadow = 0;
    let costumeId = null;
    let isCostumeShiny = 0;

    // Determine if the Pokémon is shadow or shiny
    if (canBeShinyShadow && faker.datatype.boolean()) {
        isShiny = 1;
        isShadow = 1;
    } else if (canBeShadow && faker.datatype.boolean()) {
        isShadow = 1;
    } else {
        if (canBeShiny && faker.datatype.boolean()) {
            isShiny = 1;
        }

        // Handle costumes only if the Pokémon is not shadow
        if (pokemon.costumes && pokemon.costumes.length > 0) {
            const costume = faker.helpers.arrayElement(pokemon.costumes);
            costumeId = costume.costume_id;

            if (costume.shiny_available === 1 && faker.datatype.boolean()) {
                isCostumeShiny = 1;
            }
        }
    }

    // Gender determination logic based on gender_rate (format: "87M_12F_0GL")
    const genderRate = pokemon.gender_rate;
    let gender = 'genderless';

    if (genderRate) {
        const [maleRate, femaleRate] = genderRate.split('_').map(rate => parseInt(rate));

        const randomValue = faker.number.int({ min: 0, max: 100 });
        if (randomValue <= maleRate) {
            gender = 'male';
        } else if (randomValue > maleRate && randomValue <= maleRate + femaleRate) {
            gender = 'female';
        }
    }

    const fastMove = pokemon.moves.find(move => move.is_fast);
    const chargedMoves = pokemon.moves.filter(move => !move.is_fast);

    // Handle is_owned, is_unowned, is_for_trade, and is_wanted logic
    let isOwned = 1;
    let isUnowned = 0;
    let isForTrade = 0;
    let isWanted = 0;

    const tradeOrWantedRoll = faker.number.int({ min: 1, max: 100 });
    if (tradeOrWantedRoll <= 10) {
        isOwned = 0;
        isUnowned = 1;
        isForTrade = 0;
        isWanted = 1;
    } else if (tradeOrWantedRoll <= 30) {
        isOwned = 1;
        isUnowned = 0;
        isForTrade = 1;
        isWanted = 0;
    }

    return {
        instance_id: faker.string.uuid(), // Generate UUID for instance_id
        pokemon_id: pokemon.pokemon_id,
        shiny: isCostumeShiny || isShiny,
        shadow: isShadow,
        costume_id: costumeId,
        fast_move_id: fastMove ? fastMove.move_id : null,
        charged_move1_id: chargedMoves[0] ? chargedMoves[0].move_id : null,
        charged_move2_id: chargedMoves[1] ? chargedMoves[1].move_id : null,
        gender: gender,
        is_unowned: isUnowned,
        is_owned: isOwned,
        is_for_trade: isForTrade,
        is_wanted: isWanted,
        user_id: userId,

        // For fields we are not considering or ignoring, we set them as null:
        date_added: null,
        last_update: null,
        lucky: 0,
        purified: 0,
        nickname: null,
        cp: null,
        attack_iv: null,
        defense_iv: null,
        stamina_iv: null,
        weight: null,
        height: null,
        mirror: 0, // defaulting mirror to 0 (false)
        pref_lucky: 0, // defaulting pref_lucky to 0 (false)
        registered: 0, // defaulting registered to 0 (false)
        favorite: 0, // defaulting favorite to 0 (false)
        location_card: null,
        location_caught: null,
        friendship_level: null,
        date_caught: null,
        not_trade_list: '{}', // empty JSON for ignored fields
        not_wanted_list: '{}', // empty JSON for ignored fields
        trace_id: null
    };
}

// Function to check if the username already exists in the MySQL `users` table
async function usernameExists(connection, username) {
    const [rows] = await connection.execute(
        `SELECT COUNT(*) AS count FROM users WHERE username = ?`,
        [username]
    );
    return rows[0].count > 0;
}

// Function to insert a user into MySQL once
async function insertUser(connection, mongoUser, coordinates) {
    const latitude = coordinates.latitude !== undefined ? coordinates.latitude : null;
    const longitude = coordinates.longitude !== undefined ? coordinates.longitude : null;

    console.log(`Inserting user: ${mongoUser.username}, Latitude: ${latitude}, Longitude: ${longitude}`);

    const [rows] = await connection.execute(
        `INSERT INTO users (user_id, username, latitude, longitude) VALUES (?, ?, ?, ?)`,
        [mongoUser._id.toString(), mongoUser.username, latitude, longitude]
    );
    return rows;
}

async function insertPokemonInstance(connection, instance) {
    const values = [
        instance.instance_id,          // instance_id (varchar(255))
        instance.pokemon_id,           // pokemon_id (int)
        instance.nickname || null,     // nickname (varchar(255))
        instance.cp || null,           // cp (int)
        instance.attack_iv || null,    // attack_iv (int)
        instance.defense_iv || null,   // defense_iv (int)
        instance.stamina_iv || null,   // stamina_iv (int)
        instance.shiny,                // shiny (tinyint(1))
        instance.costume_id || null,   // costume_id (int)
        instance.lucky || 0,           // lucky (tinyint(1))
        instance.shadow,               // shadow (tinyint(1))
        instance.purified || 0,        // purified (tinyint(1))
        instance.fast_move_id || null, // fast_move_id (int)
        instance.charged_move1_id || null, // charged_move1_id (int)
        instance.charged_move2_id || null, // charged_move2_id (int)
        instance.weight || null,       // weight (double)
        instance.height || null,       // height (double)
        instance.gender || null,       // gender (varchar(10))
        instance.mirror || 0,          // mirror (tinyint(1))
        instance.pref_lucky || 0,      // pref_lucky (tinyint(1))
        instance.registered || 0,      // registered (tinyint(1))
        instance.favorite || 0,        // favorite (tinyint(1))
        instance.location_card || null, // location_card (varchar(255))
        instance.location_caught || null, // location_caught (varchar(255))
        instance.friendship_level || null, // friendship_level (int)
        instance.date_caught || null,     // date_caught (date)
        instance.date_added || new Date(), // date_added (datetime(6))
        instance.last_update || Date.now(), // last_update (bigint)
        instance.is_unowned,            // is_unowned (tinyint(1))
        instance.is_owned,              // is_owned (tinyint(1))
        instance.is_for_trade,          // is_for_trade (tinyint(1))
        instance.is_wanted,             // is_wanted (tinyint(1))
        instance.not_trade_list || '{}',  // not_trade_list (json)
        instance.not_wanted_list || '{}', // not_wanted_list (json)
        instance.trace_id || null,        // trace_id (varchar(255))
        instance.user_id,                 // user_id (varchar(255))
        instance.trade_filters || '{}',   // trade_filters (json)
        instance.wanted_filters || '{}'   // wanted_filters (json)
    ];

    const query = `INSERT INTO instances (
        instance_id, pokemon_id, nickname, cp, attack_iv, defense_iv, stamina_iv, shiny, costume_id, lucky, shadow, purified, fast_move_id, charged_move1_id, charged_move2_id, weight, height, gender, mirror, pref_lucky, registered, favorite, location_card, location_caught, friendship_level, date_caught, date_added, last_update, is_unowned, is_owned, is_for_trade, is_wanted, not_trade_list, not_wanted_list, trace_id, user_id, trade_filters, wanted_filters
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [rows] = await connection.execute(query, values);
    return rows;
}

async function generateFakeData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/PoGo_App_Users', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const mysqlConnection = await mysql.createConnection(mysqlConfig);
        console.log('Connected to MySQL');

        const mongoUsers = await User.find({}).lean();

        for (const mongoUser of mongoUsers) {
            if (mongoUser._id.toString() === '663d6760537fa61b79ac8bab' || mongoUser._id.toString() === '6682e0d67e755716f6132ab0' || mongoUser._id.toString() === '66830212c7f29ae4d62d00fe') {
                console.log(`Skipping user ${mongoUser.username} (ID: ${mongoUser._id}) as requested.`);
                continue; // Skip to the next user
            }
        
            // Check if the user already exists in MySQL
            const exists = await usernameExists(mysqlConnection, mongoUser.username);
            if (!exists) {
                // Generate coordinates and insert the user
                const coordinates = getRandomVancouverCoordinates(); // Generate random coordinates within Vancouver
                await insertUser(mysqlConnection, mongoUser, coordinates);
            } else {
                console.log(`User ${mongoUser.username} already exists in MySQL, skipping insertion.`);
            }
        
            // Continue with Pokémon instance generation
            const numPokemons = faker.number.int({ min: 1, max: 6 });
            for (let i = 0; i < numPokemons; i++) {
                const randomPokemon = getRandomPokemon();
                const pokemonInstance = generatePokemonInstance(randomPokemon, mongoUser._id.toString());
                await insertPokemonInstance(mysqlConnection, pokemonInstance);
            }
        }        

        console.log('Fake data generation completed');
        await mysqlConnection.end();
        mongoose.disconnect();
    } catch (error) {
        console.error('Error generating fake data:', error.message);
    }
}

generateFakeData();
