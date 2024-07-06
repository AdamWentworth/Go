// tokenService.js
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

const calculateExpiryTime = (seconds) => new Date(new Date().getTime() + seconds * 1000);

const createTokens = (user) => {
    const accessToken = jwt.sign({ user_id: user._id, username: user.username }, secretKey, {
        expiresIn: '1h'  // 1 hour
    });
    const refreshToken = jwt.sign({ user_id: user._id, username: user.username }, secretKey, {
        expiresIn: '7d'  // 7 days
    });

    return {
        accessToken,
        refreshToken,
        accessTokenExpiry: calculateExpiryTime(1 * 60 * 60),  // 1 hour in seconds
        refreshTokenExpiry: calculateExpiryTime(7 * 24 * 60 * 60)  // 7 days in seconds
    };
};

const createAccessToken = (user) => {
    const accessToken = jwt.sign({ user_id: user._id, username: user.username }, secretKey, {
        expiresIn: '1h'  // 1 hour
    });

    return {
        accessToken,
        accessTokenExpiry: calculateExpiryTime(1 * 60 * 60),  // 1 hour in seconds
    };
};

module.exports = { createTokens, createAccessToken };
