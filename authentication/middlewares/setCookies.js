// middleware/setCookies.js
module.exports = (req, res, next) => {
    const { accessToken, refreshToken } = req;

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 300000  // 5 minutes in milliseconds
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 600000  // 10 minutes in milliseconds
    });

    next();
};
