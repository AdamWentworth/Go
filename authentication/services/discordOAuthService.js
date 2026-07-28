const DISCORD_API_BASE = 'https://discord.com/api/v10';

function getConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const callbackUrl = process.env.DISCORD_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl) {
    const error = new Error('Discord login is not configured.');
    error.status = 503;
    throw error;
  }
  return { clientId, clientSecret, callbackUrl };
}

function createAuthorizationUrl({ state }) {
  const { clientId, callbackUrl } = getConfig();
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callbackUrl);
  url.searchParams.set('scope', 'identify email');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'consent');
  return url.toString();
}

async function exchangeCode(code) {
  const { clientId, clientSecret, callbackUrl } = getConfig();
  const tokenResponse = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl
    })
  });
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok || !tokens.access_token) {
    throw new Error('Discord authorization code exchange failed.');
  }

  const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  const user = await userResponse.json();
  if (!userResponse.ok || !user.id || !user.email || user.verified !== true) {
    throw new Error('Discord did not provide a verified email address.');
  }

  return {
    subject: String(user.id),
    email: user.email.trim().toLowerCase(),
    emailVerified: true
  };
}

module.exports = { createAuthorizationUrl, exchangeCode };
