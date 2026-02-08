const tokenService = require('../services/tokenService');

module.exports = (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  if (!accessToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const decoded = tokenService.verifyAccessToken(accessToken);
  if (!decoded || !decoded.user_id) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  req.auth = {
    userId: String(decoded.user_id),
    username: decoded.username || ''
  };

  next();
};
