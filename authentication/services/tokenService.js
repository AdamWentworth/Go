// tokenService.js

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_TTL = '7d';
const JWT_ALGORITHM = 'HS256';
const DEFAULT_ISSUER = 'pokemongonexus-auth';
const DEFAULT_AUDIENCE = 'pokemongonexus-clients';

const getJwtIssuer = () => process.env.JWT_ISSUER || DEFAULT_ISSUER;
const getJwtAudience = () => process.env.JWT_AUDIENCE || DEFAULT_AUDIENCE;

const getBaseSecretKey = () => {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        throw new Error('JWT_SECRET is not configured');
    }
    return secretKey;
};

const getAccessSecretKey = () => process.env.ACCESS_TOKEN_SECRET || getBaseSecretKey();
const getRefreshSecretKey = () => process.env.REFRESH_TOKEN_SECRET || getBaseSecretKey();

const calculateExpiryTime = (seconds) => new Date(Date.now() + seconds * 1000);

const createTokens = (user, device_id) => {
    const payload = {
        user_id: String(user._id),
        username: user.username,
        device_id
    };

    const accessToken = jwt.sign(payload, getAccessSecretKey(), {
        expiresIn: ACCESS_TOKEN_TTL,
        algorithm: JWT_ALGORITHM,
        issuer: getJwtIssuer(),
        audience: getJwtAudience(),
        subject: String(user._id)
    });
    const refreshToken = jwt.sign(
        {
            user_id: String(user._id),
            username: user.username,
            device_id,
            jti: crypto.randomUUID()
        },
        getRefreshSecretKey(),
        {
            expiresIn: REFRESH_TOKEN_TTL,
            algorithm: JWT_ALGORITHM,
            issuer: getJwtIssuer(),
            audience: getJwtAudience(),
            subject: String(user._id)
        }
    );

    return {
        accessToken,
        refreshToken,
        accessTokenExpiry: calculateExpiryTime(ACCESS_TOKEN_TTL_SECONDS),
        refreshTokenExpiry: calculateExpiryTime(REFRESH_TOKEN_TTL_SECONDS)
    };
};

const createAccessToken = (user, device_id) => {
    const payload = {
        user_id: String(user._id),
        username: user.username,
        device_id
    };

    const accessToken = jwt.sign(payload, getAccessSecretKey(), {
        expiresIn: ACCESS_TOKEN_TTL,
        algorithm: JWT_ALGORITHM,
        issuer: getJwtIssuer(),
        audience: getJwtAudience(),
        subject: String(user._id)
    });

    return {
        accessToken,
        accessTokenExpiry: calculateExpiryTime(ACCESS_TOKEN_TTL_SECONDS)
    };
};

/**
 * Verify the access token and return the decoded payload if valid, or null if invalid/expired.
 * @param {string} token
 * @returns {object|null}
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, getAccessSecretKey(), {
            algorithms: [JWT_ALGORITHM],
            issuer: getJwtIssuer(),
            audience: getJwtAudience()
        });
    } catch (err) {
        console.error('[verifyAccessToken] error:', err);
        return null; // or throw err if you prefer
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, getRefreshSecretKey(), {
            algorithms: [JWT_ALGORITHM],
            issuer: getJwtIssuer(),
            audience: getJwtAudience()
        });
    } catch (err) {
        console.error('[verifyRefreshToken] error:', err);
        return null;
    }
};

module.exports = {
    createTokens,
    createAccessToken,
    verifyAccessToken,
    verifyRefreshToken
};
