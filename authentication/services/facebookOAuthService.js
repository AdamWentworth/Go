const crypto = require('crypto');

const GRAPH_API_BASE = 'https://graph.facebook.com';

function getConfig() {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const callbackUrl = process.env.FACEBOOK_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl) {
    const error = new Error('Facebook login is not configured.');
    error.status = 503;
    throw error;
  }
  return { clientId, clientSecret, callbackUrl };
}

function createAuthorizationUrl({ state }) {
  const { clientId, callbackUrl } = getConfig();
  const url = new URL('https://www.facebook.com/dialog/oauth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('scope', 'email,public_profile');
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

async function exchangeCode(code) {
  const { clientId, clientSecret, callbackUrl } = getConfig();
  const tokenUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', clientId);
  tokenUrl.searchParams.set('client_secret', clientSecret);
  tokenUrl.searchParams.set('redirect_uri', callbackUrl);
  tokenUrl.searchParams.set('code', code);

  const tokenResponse = await fetch(tokenUrl);
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok || !tokens.access_token) {
    throw new Error('Facebook authorization code exchange failed.');
  }

  const appSecretProof = crypto
    .createHmac('sha256', clientSecret)
    .update(tokens.access_token)
    .digest('hex');
  const userUrl = new URL(`${GRAPH_API_BASE}/me`);
  userUrl.searchParams.set('fields', 'id,email');
  userUrl.searchParams.set('access_token', tokens.access_token);
  userUrl.searchParams.set('appsecret_proof', appSecretProof);

  const userResponse = await fetch(userUrl);
  const user = await userResponse.json();
  if (!userResponse.ok || !user.id || !user.email) {
    throw new Error('Facebook did not provide an email address.');
  }

  return {
    subject: String(user.id),
    email: user.email.trim().toLowerCase(),
    emailVerified: true
  };
}

module.exports = { createAuthorizationUrl, exchangeCode };
