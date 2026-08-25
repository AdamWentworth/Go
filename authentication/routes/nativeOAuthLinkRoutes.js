const express = require('express');

const requireAuth = require('../middlewares/requireAuth');
const googleOAuth = require('../services/googleOAuthService');
const discordOAuth = require('../services/discordOAuthService');
const facebookOAuth = require('../services/facebookOAuthService');
const {
  consumeNativeOAuthLink,
  createNativeOAuthLink
} = require('../services/nativeOAuthLinkService');

const router = express.Router();
const providers = new Set(['google', 'discord', 'facebook']);

const recentlyAuthenticated = (issuedAt) => {
  const ageSeconds = Math.floor(Date.now() / 1000) - Number(issuedAt || 0);
  return ageSeconds >= 0 && ageSeconds <= 15 * 60;
};

const authorizationUrlFor = (provider, flow) => {
  if (provider === 'google') {
    return googleOAuth.createAuthorizationUrl({ state: flow.state, nonce: flow.nonce });
  }
  if (provider === 'discord') {
    return discordOAuth.createAuthorizationUrl({ state: flow.state });
  }
  return facebookOAuth.createAuthorizationUrl({ state: flow.state });
};

router.post('/mobile/oauth/link/start', requireAuth, async (req, res) => {
  try {
    const provider = typeof req.body?.provider === 'string'
      ? req.body.provider.trim().toLowerCase()
      : '';
    if (!providers.has(provider)) {
      return res.status(400).json({ message: 'Unsupported OAuth provider.' });
    }
    if (!req.auth.deviceId || !recentlyAuthenticated(req.auth.issuedAt)) {
      return res.status(401).json({ message: 'Sign in again before connecting an account.' });
    }
    const flow = await createNativeOAuthLink({
      userId: req.auth.userId,
      provider,
      deviceId: req.auth.deviceId
    });
    return res.status(201).json({
      provider,
      authorizationUrl: authorizationUrlFor(provider, flow)
    });
  } catch {
    return res.status(500).json({ message: 'Unable to start account connection.' });
  }
});

router.post('/mobile/oauth/link/exchange', requireAuth, async (req, res) => {
  const resultCode = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (resultCode.length < 32 || resultCode.length > 128 || !req.auth.deviceId) {
    return res.status(400).json({ message: 'Invalid or expired account connection result.' });
  }
  const transaction = await consumeNativeOAuthLink({
    resultCode,
    userId: req.auth.userId,
    deviceId: req.auth.deviceId
  });
  if (!transaction) {
    return res.status(409).json({ message: 'This account connection result is invalid, expired, or already used.' });
  }
  return res.json({
    provider: transaction.provider,
    status: transaction.resultStatus
  });
});

module.exports = router;
