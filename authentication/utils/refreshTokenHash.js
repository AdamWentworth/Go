const crypto = require('crypto');

const getHashSecret = () => process.env.JWT_SECRET || '';

const hashRefreshToken = (token) => {
  if (typeof token !== 'string' || token.length === 0) return '';
  return crypto.createHash('sha256').update(`${token}:${getHashSecret()}`).digest('hex');
};

module.exports = {
  hashRefreshToken
};
