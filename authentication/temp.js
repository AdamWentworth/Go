const mongoose = require('mongoose');
const User = require('./models/user');  // Ensure this path correctly points to your User model

// Your MongoDB connection string
const mongoURI = 'mongodb://localhost:27017/PoGo_App_Users'; 

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));

const updateRefreshTokens = async () => {
    try {
        // Fetch all users who have a refreshToken field
        const users = await User.find({"refreshToken": {$exists: true}});

        for (const user of users) {
            // Convert refreshToken to an array if it's not one or enforce update
            if (!Array.isArray(user.refreshToken) || typeof user.refreshToken === 'object') {
                user.refreshToken = [].concat(user.refreshToken);
                await user.save();
                console.log(`Updated user ${user._id}`);
            }
        }

        console.log('All users updated successfully.');
    } catch (error) {
        console.error('Error updating users:', error);
    } finally {
        mongoose.disconnect();
    }
};

updateRefreshTokens();
