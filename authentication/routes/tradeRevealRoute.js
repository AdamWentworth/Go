// routes/tradeRevealRoute.js

const express = require('express');
const router = express.Router();
const User = require('../models/user');
const tokenService = require('../services/tokenService'); // your custom token utilities
const logger = require('../middlewares/logger');

// POST /api/trade/reveal-partner-info
router.post('/reveal-partner-info', async (req, res) => {
  try {
    // We'll expect the entire `trade` object in req.body
    const { trade } = req.body;

    // Extract the access token from cookies
    // (assuming your front-end sets "accessToken" cookie via setAccessTokenCookie or similar)
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      logger.error('Reveal Partner Info: No access token provided in cookies');
      return res.status(401).json({ message: 'No access token provided.' });
    }

    // Validate the token (parse it, verify signature, etc.)
    // Depending on your token structure, 'verifyAccessToken' might return the decoded payload
    const decoded = tokenService.verifyAccessToken(accessToken);
    if (!decoded) {
      logger.error('Reveal Partner Info: Invalid or expired token');
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    // `decoded` should contain something like { sub: userId, iat, exp, ... }
    const userId = decoded.user_id;

    // Find the user in MongoDB
    const currentUser = await User.findById(userId).exec();
    if (!currentUser) {
      logger.error(`Reveal Partner Info: No user found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found.' });
    }

    // The trade includes `username_proposed` and `username_accepting`.
    // Check if currentUser is part of the trade.
    if (
      currentUser.username !== trade.username_proposed &&
      currentUser.username !== trade.username_accepting
    ) {
      logger.error('Reveal Partner Info: Current user is not part of this trade');
      return res.status(403).json({ message: 'Forbidden. You are not in this trade.' });
    }

    // Determine the partner’s username
    const partnerUsername =
      currentUser.username === trade.username_proposed
        ? trade.username_accepting
        : trade.username_proposed;

    // Look up the partner user
    const partnerUser = await User.findOne({ username: partnerUsername }).exec();
    if (!partnerUser) {
      logger.error(`Reveal Partner Info: Partner user not found for username: ${partnerUsername}`);
      return res.status(404).json({ message: 'Partner user not found.' });
    }

    // Return the partner’s trainer code & pokemonGoName
    // (You can choose to return other fields if needed)
    const revealData = {
      trainerCode: partnerUser.trainerCode || null,
      pokemonGoName: partnerUser.pokemonGoName || null,
    };

    logger.info(`Reveal Partner Info: Successfully returning partner info for user=${partnerUsername}`);
    return res.json(revealData);
  } catch (err) {
    logger.error(`Reveal Partner Info: Unexpected error: ${err}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
