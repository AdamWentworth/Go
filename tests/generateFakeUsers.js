// generateFakeUsers.js

const mongoose = require('../authentication/middlewares/mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const User = require('../authentication/models/user');

const NUM_USERS = 1000; // Generate 1000 users

// Vancouver coordinates boundaries (approximate)
const VANCOUVER_BOUNDS = {
  minLat: 49.198,   // Southern boundary (Richmond/Tsawwassen)
  maxLat: 49.316,   // Northern boundary (North Vancouver mountains)
  minLon: -123.264, // Western boundary (Howe Sound)
  maxLon: -123.023  // Eastern boundary (Port Moody/Coquitlam)
};

// Generate sequential trainer codes
function generateTrainerCode(index) {
  return (index + 1).toString().padStart(12, '0');
}

async function generateUsers() {
  for (let i = 0; i < NUM_USERS; i++) {
    const paddedNumber = (i + 1).toString().padStart(4, '0');
    const username = `fakeUser${paddedNumber}`;
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = new User({
      username: username,
      email: `${username}@example.com`,
      password: hashedPassword,
      pokemonGoName: username,
      trainerCode: generateTrainerCode(i),
      location: 'Vancouver, British Columbia, Canada',
      allowLocation: false,
      googleId: faker.string.uuid(),
      facebookId: faker.string.uuid(),
      twitterId: faker.string.uuid(),
      nintendoId: faker.string.uuid(),
      discordId: faker.string.uuid(),
      coordinates: {
        latitude: faker.location.latitude({
          min: VANCOUVER_BOUNDS.minLat,
          max: VANCOUVER_BOUNDS.maxLat,
          precision: 6
        }),
        longitude: faker.location.longitude({
          min: VANCOUVER_BOUNDS.minLon,
          max: VANCOUVER_BOUNDS.maxLon,
          precision: 6
        })
      }
    });

    try {
      await user.save();
      console.log(`User ${user.username} inserted successfully`);
    } catch (error) {
      console.error(`Error inserting user ${user.username}: ${error.message}`);
    }

    // Log progress every 100 users
    if ((i + 1) % 100 === 0) {
      console.log(`Progress: ${i + 1}/${NUM_USERS} users generated`);
    }
  }

  console.log('Finished inserting fake users');
  mongoose.disconnect();
}

// Connection handling
if (mongoose.connection.readyState === 1) {
  generateUsers();
} else {
  mongoose.connection.on('connected', generateUsers);
}

// Error handling
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
  mongoose.disconnect();
});