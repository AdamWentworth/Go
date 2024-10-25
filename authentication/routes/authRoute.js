// authRoute.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const logger = require('../middlewares/logger'); // Ensure logger is imported correctly
const tokenService = require('../services/tokenService'); // Adjust the path as necessary
const setCookies = require('../middlewares/setCookies'); // Adjust the path as necessary
const setAccessTokenCookie = require('../middlewares/setAccessTokenCookie');

// Function to handle token response more dynamically
function handleTokenResponse(req, res, user, tokens) {
    req.accessToken = tokens.accessToken;
    req.refreshToken = tokens.refreshToken;
    res.locals.user = user;
    res.locals.tokens = tokens;
}

router.post('/register', async (req, res, next) => {
    try {

        if (await User.findOne({ username: req.body.username })) {
            logger.error(`Registration failed: Username already exists with status ${409}`);
            return res.status(409).json({ message: 'Username already exists' });
        }

        if (await User.findOne({ email: req.body.email })) {
            logger.error(`Registration failed: Email already exists with status ${409}`);
            return res.status(409).json({ message: 'Email already exists' });
        }

        if (req.body.pokemonGoName && await User.findOne({ pokemonGoName: req.body.pokemonGoName })) {
            logger.error(`Registration failed: Pokémon Go name already exists with status ${409}`);
            return res.status(409).json({ message: 'Pokémon Go name already exists' });
        }

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

        const device_id = req.body.device_id;  // Get device_id from the request body

        const tokens = tokenService.createTokens(savedUser, device_id);
        handleTokenResponse(req, res, savedUser, tokens);

        // Clean up expired refresh tokens and tokens with the same device_id before adding a new one
        await User.findByIdAndUpdate(savedUser._id, {
            $pull: {
                'refreshToken': {
                    $or: [
                        { expires: { $lte: new Date() } },  // Remove expired tokens
                        { device_id: device_id }            // Remove tokens with the same device_id
                    ]
                }
            }
        });

        // Store the refresh token along with device_id
        await User.findByIdAndUpdate(savedUser._id, {
            $push: {'refreshToken': {
                token: tokens.refreshToken,
                expires: tokens.refreshTokenExpiry,
                device_id: device_id
            }}
        });
        next();
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            logger.error(`Registration failed: Duplicate key error on field ${field} with status ${409}`);
            return res.status(409).json({ message: `${field} already exists` });
        }
        logger.error(`Registration error: ${err.message} with status ${500}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}, setCookies, (req, res) => {
    const { user, tokens } = res.locals;
    res.status(201).json({
        user: {
            username: user.username,
            email: user.email
        },
        message: 'Account created successfully.'
    });
    logger.info(`User ${user.username} registered successfully with status ${201}`);
});

router.post('/login', async (req, res, next) => {
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

        const device_id = req.body.device_id;  // Get device_id from the request body

        // Clean up expired refresh tokens and tokens with the same device_id before adding a new one
        await User.findByIdAndUpdate(user._id, {
            $pull: {
                'refreshToken': {
                    $or: [
                        { expires: { $lte: new Date() } },  // Remove expired tokens
                        { device_id: device_id }            // Remove tokens with the same device_id
                    ]
                }
            }
        });

        const tokens = tokenService.createTokens(user, device_id);

        // Update user with new refresh token details by adding to the array
        await User.findByIdAndUpdate(user._id, {
            $push: {'refreshToken': {
                token: tokens.refreshToken,
                expires: tokens.refreshTokenExpiry,
                device_id: device_id
            }}
        });

        handleTokenResponse(req, res, user, tokens);
        next();
    } catch (err) {
        logger.error(`Login error: ${err.message} with status ${500}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}, setCookies, (req, res) => {
    const { user, tokens } = res.locals;
    res.status(200).json({
        user_id: user._id.toString(),
        username: user.username,
        email: user.email,
        pokemonGoName: user.pokemonGoName,
        trainerCode: user.trainerCode,
        allowLocation: user.allowLocation,
        country: user.country,
        city: user.city,
        accessTokenExpiry: tokens.accessTokenExpiry.toISOString(),
        refreshTokenExpiry: tokens.refreshTokenExpiry.toISOString(),
        message: 'Logged in successfully'
    });
    logger.info(`User ${user.username} logged in successfully with status ${200}`);
});

router.post('/refresh', async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        logger.error('Refresh failed: No refresh token provided');
        return res.status(401).json({ message: 'Refresh token required' });
    }

    try {
        // Clean up expired refresh tokens
        await User.updateOne(
            { 'refreshToken.token': refreshToken },
            { $pull: { 'refreshToken': { expires: { $lte: new Date() } } } }
        );

        const user = await User.findOne({
            'refreshToken': { $elemMatch: { token: refreshToken, expires: { $gt: new Date() } } }
        }).exec();

        if (!user) {
            logger.error('Refresh failed: Invalid or expired refresh token');
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        req.tokenIndex = user.refreshToken.findIndex(rt => rt.token === refreshToken);
        if (req.tokenIndex === -1 || user.refreshToken[req.tokenIndex].expires <= new Date()) {
            logger.error('Refresh failed: Token not found or expired');
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        const device_id = user.refreshToken[req.tokenIndex].device_id;  // Retrieve device_id from the stored refresh token

        logger.debug(`User ${user.username} found with valid refresh token. Proceeding to create new access token.`);

        const tokens = tokenService.createAccessToken(user, device_id);  // Include device_id in access token

        handleTokenResponse(req, res, user, tokens);
        next();
    } catch (err) {
        logger.error(`Refresh token error: ${err.message}`);
        res.status(500).json({ message: 'Failed to refresh tokens', error: err.toString() });
    }
}, setAccessTokenCookie, (req, res) => {
    const { user, tokens } = res.locals;
    res.status(200).json({
        user_id: user._id.toString(),
        username: user.username,
        email: user.email,
        pokemonGoName: user.pokemonGoName,
        trainerCode: user.trainerCode,
        allowLocation: user.allowLocation,
        country: user.country,
        city: user.city,
        accessTokenExpiry: tokens.accessTokenExpiry.toISOString(),
        refreshTokenExpiry: user.refreshToken[req.tokenIndex].expires.toISOString() // Now using req.tokenIndex
    });
    logger.info(`User ${user.username} refreshed token successfully with status ${200}`);
});

// Update user details
router.put('/update/:id', async (req, res) => {
    const { id } = req.params; // Ensure id is fetched at the start of the function
    if (!id) {
        logger.error('No ID provided in the request parameters');
        return res.status(400).json({ message: 'Request must include an ID' });
    }

    try {
        const updates = { ...req.body };

        // Remove token expiry fields from updates to prevent them from being modified
        const { accessTokenExpiry, refreshTokenExpiry } = updates;
        delete updates.accessTokenExpiry;
        delete updates.refreshTokenExpiry;

        // Check if the username is already taken by another user
        const existingUserWithUsername = await User.findOne({
            username: updates.username, 
            _id: { $ne: id }
        });
        if (existingUserWithUsername) {
            logger.error(`Update failed: Username already exists with status 409`);
            return res.status(409).json({ message: 'Username already exists' });
        }

        // Check if the email is already taken by another user
        const existingUserWithEmail = await User.findOne({
            email: updates.email, 
            _id: { $ne: id }
        });
        if (existingUserWithEmail) {
            logger.error(`Update failed: Email already exists with status 409`);
            return res.status(409).json({ message: 'Email already exists' });
        }

        // Check if the Pokémon Go name is already taken by another user
        if (updates.pokemonGoName) {
            const existingUserWithPokemonGoName = await User.findOne({
                pokemonGoName: updates.pokemonGoName, 
                _id: { $ne: id }
            });
            if (existingUserWithPokemonGoName) {
                logger.error(`Update failed: Pokémon Go name already exists with status 409`);
                return res.status(409).json({ message: 'Pokémon Go name already exists' });
            }
        }

        // Check if the trainer code is already taken by another user
        if (updates.trainerCode) {
            const existingUserWithTrainerCode = await User.findOne({
                trainerCode: updates.trainerCode, 
                _id: { $ne: id }
            });
            if (existingUserWithTrainerCode) {
                logger.error(`Update failed: Trainer Code already exists with status 409`);
                return res.status(409).json({ message: 'Trainer Code already exists' });
            }
        }

        // Hash new password if provided
        if (updates.password && updates.password.trim() !== "") {
            updates.password = await bcrypt.hash(updates.password, 10);
        } else {
            delete updates.password;
        }

        logger.info(`Updating user details for User ID: ${id} with data: ${JSON.stringify(updates)}`);
        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedUser) {
            logger.error(`Update failed: User not found with ID: ${id} with status 404`);
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`User ${updatedUser.username} updated successfully with status 200`);
        const responsePayload = {
            user_id: updatedUser._id.toString(),
            username: updatedUser.username,
            email: updatedUser.email,
            pokemonGoName: updatedUser.pokemonGoName || '',
            trainerCode: updatedUser.trainerCode || '',
            allowLocation: updatedUser.allowLocation || false,
            country: updatedUser.country || '',
            city: updatedUser.city || '',
            accessTokenExpiry: accessTokenExpiry,
            refreshTokenExpiry: refreshTokenExpiry,
            message: 'Updated account details successfully'
        };
        res.status(200).json(responsePayload);
    } catch (err) {
        logger.error(`Unhandled exception on user update for ID: ${id}: ${err} with status 500`);
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
        logger.info(`User ${user.username} with ID ${id} deleted successfully with status ${200}`);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        logger.error(`Unhandled exception on user delete for ID: ${id}: ${err} with status ${500}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        logger.error('Logout failed: No refresh token provided');
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const user = await User.findOneAndUpdate(
            { 'refreshToken.token': refreshToken },
            { $pull: {'refreshToken': { token: refreshToken }}}
        );

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        if (user) {
            logger.info(`User ${user.username} logged out successfully with status ${200}`);
        } else {
            logger.warn('Logout attempt failed: User not found');
        }

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        logger.error(`Logout error: ${err.message} with status ${500}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
