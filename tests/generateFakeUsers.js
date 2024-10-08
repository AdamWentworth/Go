const mongoose = require('../authentication/middlewares/mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');
const User = require('../authentication/models/user'); // Adjust the path as necessary

const NUM_USERS = 500; // Number of users to generate

// Helper function to generate a 12-digit number as a string
function generateTrainerCode() {
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += Math.floor(Math.random() * 10); // Random digit between 0 and 9
  }
  return code;
}

async function generateUsers() {
    for (let i = 0; i < NUM_USERS; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10); // Use a generic password for all fake users
  
      const user = new User({
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: hashedPassword,
        pokemonGoName: faker.internet.userName(), // Optional field
        trainerCode: generateTrainerCode(), // Generate a 12-digit string manually
        country: 'Canada', // Hardcoded to Canada
        city: 'Vancouver', // Hardcoded to Vancouver
        allowLocation: true, // Set allowLocation to always be true
        googleId: faker.string.uuid(),
        facebookId: faker.string.uuid(),
        twitterId: faker.string.uuid(),
        nintendoId: faker.string.uuid(),
        discordId: faker.string.uuid(),
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
  
  // Start generating users after ensuring the connection is established
  if (mongoose.connection.readyState === 1) {
    generateUsers();
  } else {
    mongoose.connection.on('connected', generateUsers);
  }
  
  // Catch unhandled promise rejections
  process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    mongoose.disconnect();
});  

// Start generating users after ensuring the connection is established
if (mongoose.connection.readyState === 1) {
  generateUsers();
} else {
  mongoose.connection.on('connected', generateUsers);
}

// Catch unhandled promise rejections
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
  mongoose.disconnect();
});
