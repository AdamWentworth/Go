// tokenService.js
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

const calculateExpiryTime = (seconds) => new Date(new Date().getTime() + seconds * 1000);

const createTokens = (user) => {
    const accessToken = jwt.sign({ userId: user._id, username: user.username }, secretKey, {
        expiresIn: '5m'  // 5 minutes for development testing
    });
    const refreshToken = jwt.sign({ userId: user._id, username: user.username }, secretKey, {
        expiresIn: '10m'  // 10 minutes for development testing
    });

    return {
        accessToken,
        refreshToken,
        accessTokenExpiry: calculateExpiryTime(5 * 60),  // 5 minutes in seconds
        refreshTokenExpiry: calculateExpiryTime(10 * 60)  // 10 minutes in seconds
    };
};

const createAccessToken = (user) => {
    const accessToken = jwt.sign({ userId: user._id, username: user.username }, secretKey, {
        expiresIn: '5m'  // 5 minutes for development testing
    });

    return {
        accessToken,
        accessTokenExpiry: calculateExpiryTime(5 * 60),  // 5 minutes in seconds
    };
};

const encryptToken = (token) => {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

const decryptToken = (encryptedText) => {
    let textParts = encryptedText.split(':');
    let iv = Buffer.from(textParts[0], 'hex');
    let encryptedTextBuffer = Buffer.from(textParts[1], 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedTextBuffer, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

module.exports = { createTokens, createAccessToken, encryptToken, decryptToken };
