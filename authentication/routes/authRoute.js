// authRoute.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const logger = require('../middlewares/logger'); // Ensure logger is imported correctly

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

        const token = jwt.sign({ userId: savedUser._id, username: savedUser.username }, secretKey, { expiresIn: '24h' });

        res.status(201).json({
            user: {
                username: savedUser.username,
                email: savedUser.email
            },
            token: token,
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

        const token = jwt.sign({ userId: user._id, username: user.username }, secretKey, { expiresIn: '24h' });

        res.status(200).json({
            user_id: user._id.toString(),
            username: user.username,
            email: user.email,
            pokemonGoName: user.pokemonGoName, // Ensure these fields exist
            trainerCode: user.trainerCode,
            token: token,
            allowLocation: user.allowLocation,
            country: user.country,
            city: user.city,
            message: 'Logged in successfully'
        });
        logger.info(`User ${user.username} logged in successfully with status ${200}`);
    } catch (err) {
        logger.error(`Login error: ${err.message} with status ${500}`);
        res.status(500).json({ message: 'Internal Server Error' });
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

module.exports = router;
