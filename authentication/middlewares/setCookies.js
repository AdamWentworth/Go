// middlewares/setCookies.js
module.exports = (req, res, next) => {
  const { accessToken, refreshToken } = req;

  // Access-token cookie (1 h)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,          // ALWAYS send only over HTTPS
    sameSite: 'None',      // Allow cross-site requests (dev frontend → prod API)
    maxAge: 60 * 60 * 1000
  });

  // Refresh-token cookie (7 d)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  next();
};
