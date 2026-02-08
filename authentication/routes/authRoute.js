// authRoute.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const logger = require('../middlewares/logger'); // Ensure logger is imported correctly
const tokenService = require('../services/tokenService'); // Adjust the path as necessary
const setCookies = require('../middlewares/setCookies'); // Adjust the path as necessary
const setAccessTokenCookie = require('../middlewares/setAccessTokenCookie');
const sanitizeForLogging= require ('../utils/sanitizeLogging');

// Function to handle token response more dynamically
function handleTokenResponse(req, res, user, tokens) {
    req.accessToken = tokens.accessToken;
    req.refreshToken = tokens.refreshToken;
    res.locals.user = user;
    res.locals.tokens = tokens;
}

router.post('/register', async (req, res, next) => {
    try {
        const { username, email, pokemonGoName, trainerCode, password, device_id, location } = req.body;

        // Check for existing unique fields
        if (await User.findOne({ username })) {
            logger.error(`Registration failed: Username "${username}" already exists with status 409`);
            return res.status(409).json({ message: 'Username already exists' });
        }

        if (await User.findOne({ email })) {
            logger.error(`Registration failed: Email "${email}" already exists with status 409`);
            return res.status(409).json({ message: 'Email already exists' });
        }

        if (pokemonGoName && await User.findOne({ pokemonGoName })) {
            logger.error(`Registration failed: Pokémon Go Name "${pokemonGoName}" already exists with status 409`);
            return res.status(409).json({ message: 'Pokémon Go name already exists' });
        }

        if (trainerCode && await User.findOne({ trainerCode })) {
            logger.error(`Registration failed: Trainer Code "${trainerCode}" already exists with status 409`);
            return res.status(409).json({ message: 'Trainer Code already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user instance
        const newUser = new User({
            username,
            email,
            pokemonGoName: pokemonGoName || null, // Ensure null for empty string
            trainerCode: trainerCode || null,    // Ensure null for empty string
            password: hashedPassword,
            ...req.body.coordinates && { coordinates: req.body.coordinates }, // Add coordinates if present
            allowLocation: req.body.allowLocation || false,
            location: location || null // Add location field
        });

        // Save user with writeConcern for reliability
        const savedUser = await newUser.save({ writeConcern: { w: "majority" } });

        logger.debug(`User "${username}" saved successfully, attempting to create tokens.`);

        // Create tokens
        const tokens = tokenService.createTokens(savedUser, device_id);

        // Clean up expired tokens or duplicate device_id entries
        await User.findByIdAndUpdate(savedUser._id, {
            $pull: {
                'refreshToken': {
                    $or: [
                        { expires: { $lte: new Date() } },
                        { device_id }
                    ]
                }
            }
        });

        // Add the new refresh token
        await User.findByIdAndUpdate(savedUser._id, {
            $push: {
                refreshToken: {
                    token: tokens.refreshToken,
                    expires: tokens.refreshTokenExpiry,
                    device_id
                }
            }
        });

        // Pass user and tokens to response middleware
        res.locals.user = savedUser;
        res.locals.tokens = tokens;
        next();
    } catch (err) {
        if (err.code === 11000) {
            // Handle duplicate key error
            const field = Object.keys(err.keyPattern)[0];
            logger.error(`Registration failed: Duplicate key error on field "${field}" with status 409`);
            return res.status(409).json({ message: `${field} already exists` });
        }
        logger.error(`Registration error: ${err.message} with status 500`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}, setCookies, (req, res) => {
    const { user, tokens } = res.locals;
    res.status(201).json({
        user: {
            username: user.username,
            email: user.email,
            location: user.location // Optionally include location in the response
        },
        message: 'Account created successfully.'
    });
    logger.info(`User "${user.username}" registered successfully with status 201`);
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
        location: user.location,
        coordinates: user.coordinates,
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
    const { id } = req.params;
    if (!id) {
        logger.error('No ID provided in the request parameters');
        return res.status(400).json({ success: false, message: 'Request must include an ID' });
    }

    try {
        // Fetch the current user
        const currentUser = await User.findById(id);
        if (!currentUser) {
            logger.error(`Update failed: User not found with ID: ${id} with status 404`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updates = { ...req.body };

        // Remove token expiry fields from updates to prevent them from being modified
        const { accessTokenExpiry, refreshTokenExpiry } = updates;
        delete updates.accessTokenExpiry;
        delete updates.refreshTokenExpiry;

        // Initialize password update flag
        let passwordUpdated = false;

        // Handle password update
        if (updates.password && updates.password.trim() !== "") {
            const isSamePassword = await bcrypt.compare(updates.password, currentUser.password);
            if (isSamePassword) {
                // Password is identical; do not update
                logger.info('New password is identical to the current password. Skipping password update.');
                delete updates.password;
            } else {
                // Hash the new password
                updates.password = await bcrypt.hash(updates.password, 10);
                passwordUpdated = true;
            }
        } else {
            delete updates.password;
        }

        // Validation checks for unique fields
        const uniqueFields = [
            { field: 'username', message: 'Username already exists' },
            { field: 'email', message: 'Email already exists' },
            { field: 'pokemonGoName', message: 'Pokémon Go name already exists' },
            { field: 'trainerCode', message: 'Trainer Code already exists' }
        ];

        for (let { field, message } of uniqueFields) {
            if (updates[field]) {
                const query = { [field]: updates[field], _id: { $ne: id } };
                const existingUser = await User.findOne(query);
                if (existingUser) {
                    logger.error(`Update failed: ${message} with status 409`);
                    return res.status(409).json({ success: false, message });
                }
            }
        }

        // Sanitize updates before logging
        const sanitizedUpdates = sanitizeForLogging(updates, ['password', 'confirmPassword']);
        logger.info(`Updating user details for User ID: ${id} with data: ${JSON.stringify(sanitizedUpdates)}`);

        // Perform the update
        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedUser) {
            logger.error(`Update failed: User not found with ID: ${id} with status 404`);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        logger.info(`User ${updatedUser.username} updated successfully with status 200`);

        // Prepare the response payload
        const responsePayload = {
            success: true,
            data: { // Changed from 'user' to 'data'
                user_id: updatedUser._id.toString(),
                username: updatedUser.username,
                email: updatedUser.email,
                pokemonGoName: updatedUser.pokemonGoName || '',
                trainerCode: updatedUser.trainerCode || '',
                allowLocation: updatedUser.allowLocation || false,
                location: updatedUser.location || '',
                coordinates: updatedUser.coordinates || '',
                accessTokenExpiry: accessTokenExpiry,
                refreshTokenExpiry: refreshTokenExpiry
            },
            passwordUpdated, // Indicates if the password was changed
            message: passwordUpdated
                ? 'Updated account details successfully'
                : 'Account details updated. Password was not changed as it is identical to the previous one.'
        };        

        res.status(200).json(responsePayload);
    } catch (err) {
        logger.error(`Unhandled exception on user update for ID: ${id}: ${err} with status 500`);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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

// POST /reset-password/:token
router.post('/reset-password/', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token) {
        logger.error('Reset Password Confirmation failed: No token provided');
        return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!newPassword) {
        logger.error('Reset Password Confirmation failed: No new password provided');
        return res.status(400).json({ message: 'New password is required' });
    }

    try {
        // Find the user by reset token and ensure token is not expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }, // Token is not expired
        });

        if (!user) {
            logger.warn(`Reset Password Confirmation failed: Invalid or expired token`);
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password and remove reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        // Optionally, send a confirmation email
        // await sendPasswordResetConfirmationEmail(user.email);

        logger.info(`Password updated successfully for user ${user.email}`);

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        logger.error(`Reset Password Confirmation error: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
