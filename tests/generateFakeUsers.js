const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const User = require('../models/user'); // Adjust the path as necessary

const NUM_USERS = 1000;
const BATCH_SIZE = 100;

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017/PoGo_App_Users'; // Change this to your MongoDB URI
mongoose.connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB');
        generateUsers();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit the process with a failure code
    });

// Helper function to generate a 12-digit number as a string
function generateTrainerCode() {
    let code = '';
    for (let i = 0; i < 12; i++) {
        code += Math.floor(Math.random() * 10); // Random digit between 0 and 9
    }
    return code;
}

async function generateUsers() {
    const users = [];

    for (let i = 0; i < NUM_USERS; i++) {
        try {
            const hashedPassword = await bcrypt.hash('password123', 10); // Use a generic password for all fake users

            const user = {
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: hashedPassword,
                pokemonGoName: faker.internet.userName(),  // Or set this to `null` randomly if not always needed
                trainerCode: generateTrainerCode(),  // Generate a 12-digit string manually
                country: faker.location.country(),  // Updated from deprecated address API
                city: faker.location.city(),  // Updated from deprecated address API
                allowLocation: faker.datatype.boolean(),
                googleId: faker.string.uuid(),  // Replaced with string.uuid
                facebookId: faker.string.uuid(), // Replaced with string.uuid
                twitterId: faker.string.uuid(), // Replaced with string.uuid
                nintendoId: faker.string.uuid(), // Replaced with string.uuid
                discordId: faker.string.uuid(),  // Replaced with string.uuid
            };

            users.push(user);

            // Insert in batches
            if (users.length >= BATCH_SIZE || i === NUM_USERS - 1) {
                await User.insertMany(users, { ordered: false });
                console.log(`Inserted ${users.length} users`);
                users.length = 0; // Clear the batch
            }
        } catch (error) {
            console.error(`Error processing user batch: ${error.message}`);
            return process.exit(1); // Exit the process with a failure code
        }
    }

    console.log('Finished inserting fake users');
    mongoose.disconnect();
}
