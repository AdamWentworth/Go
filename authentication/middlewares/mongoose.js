// mongoose.js
const mongoose = require('mongoose');

// Optional: Disable buffering
mongoose.set('bufferCommands', true);
mongoose.set('bufferTimeoutMS', 0);

// MongoDB connection URI
const mongoURI = 'mongodb://localhost:27017/PoGo_App_Users';

// Connect to MongoDB
mongoose.connect(mongoURI, {
  maxPoolSize: 50, // Increase connection pool size
  serverSelectionTimeoutMS: 120000, // Increase server selection timeout
  socketTimeoutMS: 120000, // Increase socket timeout
  connectTimeoutMS: 120000, // Increase connection timeout
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit the process with a failure code
});

// Export the Mongoose instance
module.exports = mongoose;
