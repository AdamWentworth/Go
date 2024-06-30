// middleware/setCookies.js
module.exports = (req, res, next) => {
    const { accessToken, sessionToken } = req;
    // For access tokens, consider a shorter expiry, like 15 minutes (900,000 ms)
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // Only use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',  // Use 'None' only in production
        maxAge: 900000 // 15 minutes in milliseconds
    });
    // For session tokens, a longer expiry, such as 1 hour, might be more appropriate
    res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',  // Only use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',  // Use 'None' only in production
        maxAge: 3600000 // 1 hour in milliseconds
    });
    next();
};

