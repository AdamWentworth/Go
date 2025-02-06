// user.js

const mongoose = require('../middlewares/mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 36 },
    email: { type: String, unique: true, maxlength: 255, minlength: 6 },
    password: { type: String, maxlength: 1024, minlength: 6 },
    pokemonGoName: { type: String, minlength: 3, default: null },
    trainerCode: { type: String, match: [/^\d{12}$/, 'Trainer code must be 12 digits'], default: null },
    location: { type: String, default: "" },
    allowLocation: { type: Boolean, default: false },
    googleId: { type: String, default: "" },
    facebookId: { type: String, default: "" },
    twitterId: { type: String, default: "" },
    nintendoId: { type: String, default: "" },
    discordId: { type: String, default: "" },
    refreshToken: [{
        token: String,
        expires: Date,
        device_id: String
    }],
    coordinates: {
        latitude: { type: Number, default: null, min: -90, max: 90 },
        longitude: { type: Number, default: null, min: -180, max: 180 }
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
});

// Apply a unique index with a correct partial filter expression
userSchema.index({ pokemonGoName: 1 }, {
    unique: true,
    partialFilterExpression: { pokemonGoName: { $type: "string", $exists: true, $ne: null } }
});
userSchema.index({ trainerCode: 1 }, {
    unique: true,
    partialFilterExpression: { trainerCode: { $type: "string", $exists: true, $ne: null } }
});

// Pre-save middleware to handle empty strings for all string fields
userSchema.pre('save', function(next) {
    // Iterate over all the fields in the document
    for (let field in this.schema.paths) {
        if (this.schema.paths[field].instance === 'String') {
            // If the field is a String and the value is an empty string, set it to null
            if (this[field] === '') {
                this[field] = null;
            }
        }
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
