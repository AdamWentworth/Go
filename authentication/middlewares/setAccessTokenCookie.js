// middlewares/setAccessTokenCookie.js
module.exports = (req, res, next) => {
  const { accessToken } = req;

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 60 * 60 * 1000                // 1 h
  });

  next();
};
