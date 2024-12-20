// utils/tokenUtils.js

const crypto = require('crypto');

/**
 * Generates a secure random token for password reset.
 * @returns {string} - A 32-byte hexadecimal token.
 */
const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

module.exports = {
    generateResetToken,
};
