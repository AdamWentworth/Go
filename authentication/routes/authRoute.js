// authRoute.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const passport = require('passport');

// Auth login with Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Callback route for Google to redirect to
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    // Check if additional user details are needed
    if (!req.user.username) {
        // Redirect to a frontend route that handles additional info collection
        res.redirect('/complete-registration');
    } else {
        // Redirect to the user profile or dashboard
        res.redirect('/profile/');
    }
});

// Facebook authentication routes
router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/redirect', passport.authenticate('facebook'), (req, res) => {
    res.redirect('/profile/');
});

// Twitter authentication routes
router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/redirect', passport.authenticate('twitter'), (req, res) => {
    res.redirect('/profile/');
});

// Discord authentication routes
router.get('/discord', passport.authenticate('discord'));

// Callback route for Discord to redirect to after authentication
router.get('/discord/redirect', passport.authenticate('discord', {
    failureRedirect: '/login'
}), (req, res) => {
    // Successful authentication, redirect home or any other page.
    res.redirect('/profile/');  // Adjust this as necessary
});

router.post('/complete-registration', async (req, res) => {
    const { userId, username } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.username = username;
        await user.save();
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            secretKey,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            user_id: user._id.toString(), // Convert MongoDB ObjectId to string and rename it as userId
            username: user.username,
            token: token,
            message: 'Logged in successfully'
        });
        
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Registration can also be enhanced to immediately login and return a token
router.post('/register', async (req, res) => {
    try {
        if (await User.findOne({ username: req.body.username })) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        if (await User.findOne({ email: req.body.email })) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            ...req.body,
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username },
            secretKey,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            user: {
                username: newUser.username,
                email: newUser.email
            },
            token: token,
            message: 'Account created successfully.'
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Optionally retain the debug route for getting all users if helpful during development
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
