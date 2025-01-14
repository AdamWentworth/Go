// tokenService.js

const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

const calculateExpiryTime = (seconds) => new Date(Date.now() + seconds * 1000);

const createTokens = (user, device_id) => {
    const payload = {
        user_id: user._id,
        username: user.username,
        device_id
    };

    const accessToken = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ user_id: user._id, username: user.username }, secretKey, { expiresIn: '7d' });

    return {
        accessToken,
        refreshToken,
        accessTokenExpiry: calculateExpiryTime(1 * 60 * 60),
        refreshTokenExpiry: calculateExpiryTime(7 * 24 * 60 * 60)
    };
};

const createAccessToken = (user, device_id) => {
    const payload = {
        user_id: user._id,
        username: user.username,
        device_id
    };

    const accessToken = jwt.sign(payload, secretKey, { expiresIn: '1h' });

    return {
        accessToken,
        accessTokenExpiry: calculateExpiryTime(1 * 60 * 60)
    };
};

/**
 * Verify the access token and return the decoded payload if valid, or null if invalid/expired.
 * @param {string} token
 * @returns {object|null}
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, secretKey);
    } catch (err) {
        console.error('[verifyAccessToken] error:', err);
        return null; // or throw err if you prefer
    }
};

module.exports = {
    createTokens,
    createAccessToken,
    verifyAccessToken
};
