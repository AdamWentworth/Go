const tokenService = require('./tokenService');
const { hashRefreshToken } = require('../utils/refreshTokenHash');

async function createSession(User, user, deviceId) {
    const now = new Date();
    const tokens = tokenService.createTokens(user, deviceId);

    await User.findByIdAndUpdate(user._id, {
        $pull: {
            refreshToken: {
                $or: [
                    { expires: { $lte: now } },
                    { device_id: deviceId }
                ]
            }
        }
    });
    await User.findByIdAndUpdate(user._id, {
        $push: {
            refreshToken: {
                tokenHash: hashRefreshToken(tokens.refreshToken),
                expires: tokens.refreshTokenExpiry,
                device_id: deviceId
            }
        }
    });

    return tokens;
}

module.exports = { createSession };
