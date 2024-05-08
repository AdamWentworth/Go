// user.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, minlength: 6, maxlength: 36 },
    email: { type: String, required: true, unique: true, maxlength: 255, minlength: 6 },
    password: { type: String, maxlength: 1024, minlength: 6 },
    pokemonGoName: { type: String, default: "" },
    trainerCode: { type: String, match: [/^\d{12}$/, 'Trainer code must be 12 digits'], default: "" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    allowLocation: { type: Boolean, default: false },
    googleId: { type: String, default: "" },
    facebookId: { type: String, default: "" },
    twitterId: { type: String, default: "" },
    nintendoId: { type: String, default: "" },
    discordId: { type: String, default: "" }
});

module.exports = mongoose.model('User', userSchema);


