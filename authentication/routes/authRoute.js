// authRoute.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const logger = require('../middlewares/logger'); // Ensure logger is imported correctly

// Helper to calculate expiry times
const calculateExpiryTime = (seconds) => {
    return new Date(new Date().getTime() + seconds * 1000);
}

// Function to create tokens and calculate expirations
function createTokens(user) {
    const accessToken = jwt.sign({ userId: user._id, username: user.username }, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user._id, username: user.username }, secretKey, { expiresIn: '7d' });

    const accessTokenExpiry = calculateExpiryTime(3600); // 3600 seconds = 1 hour
    const refreshTokenExpiry = calculateExpiryTime(604800); // 604800 seconds = 7 days

    return { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry };
}

// Save refresh token in the database
async function saveRefreshToken(userId, refreshToken, expiresIn) {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7); // 7 days from now
    await User.findByIdAndUpdate(userId, {
        'refreshToken.token': refreshToken,
        'refreshToken.expires': expiration
    });
}

router.post('/register', async (req, res) => {
    try {
        if (await User.findOne({ username: req.body.username })) {
            logger.error(`Registration failed: Username already exists with status ${409}`);
            return res.status(409).json({ message: 'Username already exists' });
        }

        if (await User.findOne({ email: req.body.email })) {
            logger.error(`Registration failed: Email already exists with status ${409}`);
            return res.status(409).json({ message: 'Email already exists' });
        }

        // Checking for unique Pokémon Go Name
        if (req.body.pokemonGoName && await User.findOne({ pokemonGoName: req.body.pokemonGoName })) {
            logger.error(`Registration failed: Pokémon Go name already exists with status ${409}`);
            return res.status(409).json({ message: 'Pokémon Go name already exists' });
        }

        // Checking for unique Trainer Code
        if (req.body.trainerCode && await User.findOne({ trainerCode: req.body.trainerCode })) {
            logger.error(`Registration failed: Trainer Code already exists with status ${409}`);
            return res.status(409).json({ message: 'Trainer Code already exists' });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            ...req.body,
            password: hashedPassword
        });

        const savedUser = await newUser.save({ writeConcern: { w: "majority" } });
        logger.debug(`User ${req.body.username} saved successfully, attempting to create token.`);

        const { accessToken, refreshToken } = createTokens(savedUser);
        await saveRefreshToken(savedUser._id, refreshToken, 7);

        // Set tokens as HttpOnly cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 3600000 // 1 hour
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 604800000 // 7 days
        });

        res.status(201).json({
            user: {
                username: savedUser.username,
                email: savedUser.email
            },
            message: 'Account created successfully.'
        });
        logger.info(`User ${savedUser.username} registered successfully with status ${201}`);
        
    } catch (err) {
        logger.error(`Registration error: ${err.message} with status ${500}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({
            $or: [
                { username: req.body.username },
                { email: req.body.username }
            ]
        }).exec();

        if (!user) {
            logger.error(`Login failed: User not found with status ${404}`);
            return res.status(404).json({ message: 'User not found' });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            logger.error(`Login failed: Invalid password with status ${401}`);
            return res.status(401).json({ message: 'Invalid password' });
        }

        const { accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry } = createTokens(user);
        await saveRefreshToken(user._id, refreshToken, 7);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 3600000 // 1 hour
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 604800000 // 7 days
        });

        res.status(200).json({
            user_id: user._id.toString(),
            username: user.username,
            email: user.email,
            pokemonGoName: user.pokemonGoName,
            trainerCode: user.trainerCode,
            allowLocation: user.allowLocation,
            country: user.country,
            city: user.city,
            accessTokenExpiry: accessTokenExpiry.toISOString(),
            refreshTokenExpiry: refreshTokenExpiry.toISOString(),
            message: 'Logged in successfully'
        });
        logger.info(`User ${user.username} logged in successfully with status ${200}`);
    } catch (err) {
        logger.error(`Login error: ${err.message} with status ${500}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
        logger.error('Refresh token request failed: No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const payload = jwt.verify(refreshToken, secretKey);
        const user = await User.findOne({
            _id: payload.userId,
            'refreshToken.token': refreshToken,
            'refreshToken.expires': { $gt: new Date() }
        });
        if (!user) {
            logger.error(`Refresh token validation failed: Invalid or expired token for user ID ${payload.userId}`);
            return res.status(404).json({ message: 'Invalid or expired token' });
        }

        const { accessToken, refreshToken: newRefreshToken } = createTokens(user);
        await saveRefreshToken(user._id, newRefreshToken, 7);

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour
        });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 604800000 // 7 days
        });

        logger.info(`Tokens successfully refreshed for user ID ${user._id}`);
        res.status(200).json({ message: 'Tokens refreshed successfully' });
    } catch (err) {
        logger.error(`Refresh token error: ${err.message}`);
        res.status(500).json({ message: 'Failed to refresh tokens' });
    }
});


// Update user details
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        const existingUserWithUsername = await User.findOne({ username: updates.username, _id: { $ne: id } });
        if (existingUserWithUsername) {
            logger.error(`Update failed: Username already exists with status ${409}`); // Change `logger.warn` to `logger.error` for consistency
            return res.status(409).json({ message: 'Username already exists' });
        }

        const existingUserWithEmail = await User.findOne({ email: updates.email, _id: { $ne: id } });
        if (existingUserWithEmail) {
            logger.error(`Update failed: Email already exists with status ${409}`);
            return res.status(409).json({ message: 'Email already exists' });
        }

        if (updates.pokemonGoName) {
            const existingUserWithPokemonGoName = await User.findOne({ pokemonGoName: updates.pokemonGoName, _id: { $ne: id } });
            if (existingUserWithPokemonGoName) {
                logger.error(`Update failed: Pokémon Go name already exists with status ${409}`);
                return res.status(409).json({ message: 'Pokémon Go name already exists' });
            }
        }

        if (updates.trainerCode) {
            const existingUserWithTrainerCode = await User.findOne({ trainerCode: updates.trainerCode, _id: { $ne: id } });
            if (existingUserWithTrainerCode) {
                logger.error(`Update failed: Trainer Code already exists with status ${409}`);
                return res.status(409).json({ message: 'Trainer Code already exists' });
            }
        }

        // Only hash and update the password if it's provided and not empty
        if (updates.password && updates.password.trim() !== "") {
            updates.password = await bcrypt.hash(updates.password, 10);
        } else {
            delete updates.password;  // Avoid updating password if it's empty
        }

        logger.info(`Updating user details for User ID: ${id} with data: ${JSON.stringify(updates)}`);
        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedUser) {
            logger.error(`Update failed: User not found with ID: ${id}`);
            return res.status(404).json({ message: 'User not found' });
        }
        logger.info(`User ${updatedUser.username} updated successfully`);

        res.status(200).json({
            user_id: updatedUser._id.toString(),
            username: updatedUser.username,
            email: updatedUser.email,
            pokemonGoName: updatedUser.pokemonGoName || '',
            trainerCode: updatedUser.trainerCode || '',
            allowLocation: updatedUser.allowLocation || false,
            country: updatedUser.country || '',
            city: updatedUser.city || '',
            message: 'Updated account details successfully'
        });
    } catch (err) {
        logger.error(`Unhandled exception on user update for ID: ${id}: ${err}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }    
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            logger.error(`Delete failed: User not found with ID: ${id}`);
            return res.status(404).json({ message: 'User not found' });
        }
        logger.info(`User ${id} deleted successfully`);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        logger.error(`Unhandled exception on user delete for ID: ${id}: ${err}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
