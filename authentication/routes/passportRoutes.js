const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
const logger = require('../middlewares/logger'); // Ensure logger is imported correctly

// Auth login with Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Callback route for Google to redirect to
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    if (!req.user.username) {
        res.redirect('/complete-registration');
        logger.info('Redirecting to complete registration for Google user.');
    } else {
        res.redirect('/profile/');
        logger.info('Google user redirected to profile page.');
    }
});

// Facebook authentication routes
router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/redirect', passport.authenticate('facebook'), (req, res) => {
    res.redirect('/profile/');
    logger.info('Facebook user redirected to profile page.');
});

// Twitter authentication routes
router.get('/twitter', passport.authenticate('twitter'));

router.get('/twitter/redirect', passport.authenticate('twitter'), (req, res) => {
    res.redirect('/profile/');
    logger.info('Twitter user redirected to profile page.');
});

// Discord authentication routes
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/redirect', passport.authenticate('discord', {
    failureRedirect: '/login'
}), (req, res) => {
    res.redirect('/profile/');
    logger.info('Discord user redirected to profile page.');
});

router.post('/complete-registration', async (req, res) => {
    const { userId, username } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            logger.error('Complete registration failed: User not found.');
            return res.status(404).json({ message: 'User not found' });
        }
        user.username = username;
        await user.save();
        res.status(200).json({ message: 'User updated successfully' });
        logger.info(`User ${userId} completed registration successfully.`);
    } catch (error) {
        logger.error(`Internal Server Error during complete registration: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});