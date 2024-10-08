// generateFakePokemon.js

require('dotenv').config(); // Load environment variables from .env file

const mongoose = require('../authentication/middlewares/mongoose');
const mysql = require('mysql2/promise');
const {
    getRandomVancouverCoordinates,
    getRandomPokemonKey,
    generatePokemonInstance,
    updateTradeAndWantedLists
} = require('./fakePokemon/pokemonUtils');
const { usernameExists, insertUser, insertPokemonInstance } = require('./fakePokemon/dbUtils');

// MongoDB user model
const User = require('../authentication/models/user'); // Adjust the path to your User model

// MySQL connection configuration using environment variables
const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};

// Main function to generate fake Pokémon data for users
async function generateFakeData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const mysqlConnection = await mysql.createConnection(mysqlConfig);
        console.log('Connected to MySQL');

        const mongoUsers = await User.find({}).lean();
        console.log(`Found ${mongoUsers.length} users in MongoDB`);

        for (const mongoUser of mongoUsers) {
            if (
                mongoUser._id.toString() === '663d6760537fa61b79ac8bab' ||
                mongoUser._id.toString() === '6682e0d67e755716f6132ab0' ||
                mongoUser._id.toString() === '66830212c7f29ae4d62d00fe'
            ) {
                console.log(`Skipping user ${mongoUser.username} (ID: ${mongoUser._id}) as requested.`);
                continue;
            }

            // Check if the user already exists in MySQL
            const exists = await usernameExists(mysqlConnection, mongoUser.username);
            if (!exists) {
                const coordinates = getRandomVancouverCoordinates();
                await insertUser(mysqlConnection, mongoUser, coordinates);
            } else {
                console.log(`User ${mongoUser.username} already exists in MySQL, skipping insertion.`);
            }

            console.log(`Generating 20 wanted, 20 trade, and 20 owned Pokémon for user: ${mongoUser.username}`);
            const wantedInstances = [];
            const tradeInstances = [];
            const ownedInstances = []; // New array for owned Pokémon

            while (wantedInstances.length < 20 || tradeInstances.length < 20 || ownedInstances.length < 20) {
                const randomPokemonKey = getRandomPokemonKey(); // Get random pokemonKey

                const pokemonInstance = generatePokemonInstance(randomPokemonKey, mongoUser._id.toString());

                if (!pokemonInstance) {
                    // Skip this iteration if instance generation failed
                    continue;
                }

                if (pokemonInstance.is_wanted && wantedInstances.length < 20) {
                    wantedInstances.push(pokemonInstance);
                } else if (pokemonInstance.is_for_trade && tradeInstances.length < 20) {
                    tradeInstances.push(pokemonInstance);
                } else if (pokemonInstance.is_owned && !pokemonInstance.is_for_trade && !pokemonInstance.is_wanted && ownedInstances.length < 20) {
                    // Include owned Pokémon that are neither wanted nor for trade
                    ownedInstances.push(pokemonInstance);
                }
            }

            // Update not_wanted_list and not_trade_list
            updateTradeAndWantedLists(wantedInstances, tradeInstances);

            // Insert generated Pokémon instances into MySQL
            console.log(`Inserting Pokémon for user: ${mongoUser.username}`);
            for (const wantedInstance of wantedInstances) {
                await insertPokemonInstance(mysqlConnection, wantedInstance);
            }

            for (const tradeInstance of tradeInstances) {
                await insertPokemonInstance(mysqlConnection, tradeInstance);
            }

            for (const ownedInstance of ownedInstances) {
                await insertPokemonInstance(mysqlConnection, ownedInstance);
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
