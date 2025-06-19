// middlewares/mongoose.js
const mongoose = require('mongoose');

// Optional: recommended settings
mongoose.set('bufferCommands', true);
mongoose.set('bufferTimeoutMS', 0);

module.exports = mongoose;
