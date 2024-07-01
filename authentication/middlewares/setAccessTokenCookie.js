// middleware/setAccessTokenCookie.js
module.exports = (req, res, next) => {
    const { accessToken } = req;

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 300000  // 5 minutes in milliseconds
    });

    next();
};
