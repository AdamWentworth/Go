const { OAuth2Client } = require('google-auth-library');

function getConfig() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
    if (!clientId || !clientSecret || !callbackUrl) {
        const error = new Error('Google login is not configured.');
        error.status = 503;
        throw error;
    }
    return { clientId, clientSecret, callbackUrl };
}

function createClient() {
    const { clientId, clientSecret, callbackUrl } = getConfig();
    return new OAuth2Client(clientId, clientSecret, callbackUrl);
}

function createAuthorizationUrl({ state, nonce }) {
    return createClient().generateAuthUrl({
        access_type: 'online',
        prompt: 'select_account',
        scope: ['openid', 'email', 'profile'],
        state,
        nonce
    });
}

async function exchangeCode(code, expectedNonce) {
    const client = createClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) throw new Error('Google did not return an identity token.');

    const { clientId } = getConfig();
    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId
    });
    const payload = ticket.getPayload();
    if (!payload || payload.nonce !== expectedNonce) {
        throw new Error('Google identity verification failed.');
    }
    if (!payload.sub || !payload.email || payload.email_verified !== true) {
        throw new Error('Google did not provide a verified email address.');
    }

    return {
        subject: payload.sub,
        email: payload.email.trim().toLowerCase(),
        emailVerified: true
    };
}

module.exports = { createAuthorizationUrl, exchangeCode };
