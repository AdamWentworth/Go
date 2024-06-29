// tokenService.js
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

const calculateExpiryTime = (seconds) => new Date(new Date().getTime() + seconds * 1000);

const createTokens = (user) => {
    const accessToken = jwt.sign({ userId: user._id, username: user.username }, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user._id, username: user.username }, secretKey, { expiresIn: '7d' });

    return {
        accessToken,
        refreshToken,
        accessTokenExpiry: calculateExpiryTime(3600),
        refreshTokenExpiry: calculateExpiryTime(604800)
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

module.exports = { createTokens, encryptToken, decryptToken };
