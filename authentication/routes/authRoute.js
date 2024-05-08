// authRoute.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const logger = require('../middlewares/logger'); // Ensure logger is imported correctly

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            logger.error('Login failed: User not found.');
            return res.status(404).json({ message: 'User not found' });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            logger.error('Login failed: Invalid password.');
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, secretKey, { expiresIn: '24h' });

        res.status(200).json({
            user_id: user._id.toString(),
            username: user.username,
            token: token,
            message: 'Logged in successfully'
        });
        logger.info(`User ${user.username} logged in successfully.`);
        
    } catch (err) {
        logger.error(`Login error: ${err.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/register', async (req, res) => {
    try {
        if (await User.findOne({ username: req.body.username })) {
            logger.error('Registration failed: Username already exists.');
            return res.status(409).json({ message: 'Username already exists' });
        }

        if (await User.findOne({ email: req.body.email })) {
            logger.error('Registration failed: Email already exists.');
            return res.status(409).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            ...req.body,
            password: hashedPassword
        });

        await newUser.save();
        const token = jwt.sign({ userId: newUser._id, username: newUser.username }, secretKey, { expiresIn: '24h' });

        res.status(201).json({
            user: {
                username: newUser.username,
                email: newUser.email
            },
            token: token,
            message: 'Account created successfully.'
        });
        logger.info(`User ${newUser.username} registered successfully.`);
        
    } catch (err) {
        logger.error(`Registration error: ${err.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
        logger.info('Fetched all users.');
    } catch (err) {
        logger.error(`Error fetching users: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
