// generateFakePokemon.js

require('dotenv').config();

const mongoose = require('../authentication/middlewares/mongoose');
const mysql = require('mysql2/promise');
const {
    getRandomPokemonKey,
    generatePokemonInstance,
    updateTradeAndWantedLists
} = require('./fakePokemon/pokemonUtils');
const { usernameExists, insertUser, insertPokemonInstance } = require('./fakePokemon/dbUtils');

const User = require('../authentication/models/user');

const mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
};

async function generateFakeData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Increase timeout to 5s
            socketTimeoutMS: 45000 // Increase socket timeout
        });
        console.log('Connected to MongoDB');

        await mongoose.connection.asPromise();

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
                await insertUser(mysqlConnection, mongoUser);
            } else {
                console.log(`User ${mongoUser.username} already exists in MySQL, skipping insertion.`);
            }

            console.log(`Generating 20 wanted, 20 trade, and 20 caught Pokémon for user: ${mongoUser.username}`);
            const wantedInstances = [];
            const tradeInstances = [];
            const caughtInstances = [];

            while (wantedInstances.length < 20 || tradeInstances.length < 20 || caughtInstances.length < 20) {
                const randomPokemonKey = getRandomPokemonKey();
                const pokemonInstance = generatePokemonInstance(randomPokemonKey, mongoUser._id.toString());

                if (!pokemonInstance) {
                    continue;
                }

                if (pokemonInstance.is_wanted && wantedInstances.length < 20) {
                    wantedInstances.push(pokemonInstance);
                } else if (pokemonInstance.is_for_trade && tradeInstances.length < 20) {
                    tradeInstances.push(pokemonInstance);
                } else if (pokemonInstance.is_caught && !pokemonInstance.is_for_trade && !pokemonInstance.is_wanted && caughtInstances.length < 20) {
                    caughtInstances.push(pokemonInstance);
                }
            }

            updateTradeAndWantedLists(wantedInstances, tradeInstances);

            console.log(`Inserting Pokémon for user: ${mongoUser.username}`);
            for (const wantedInstance of wantedInstances) {
                await insertPokemonInstance(mysqlConnection, wantedInstance);
            }

            for (const tradeInstance of tradeInstances) {
                await insertPokemonInstance(mysqlConnection, tradeInstance);
            }

            for (const caughtInstance of caughtInstances) {
                await insertPokemonInstance(mysqlConnection, caughtInstance);
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
