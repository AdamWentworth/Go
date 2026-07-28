const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const logger = require('../middlewares/logger');
const setCookies = require('../middlewares/setCookies');
const googleOAuth = require('../services/googleOAuthService');
const { createSession } = require('../services/sessionService');

const router = express.Router();
const FLOW_TTL = '10m';
const STATE_COOKIE = 'googleOAuthState';
const PENDING_COOKIE = 'googleOAuthPending';
const TRAINER_CODE_RE = /^\d{12}$/;
const allowedFrontendOrigins = new Set([
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://pokegonexus.com',
  'https://www.pokegonexus.com'
].filter(Boolean));

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'test',
  sameSite: 'lax',
  maxAge: 10 * 60 * 1000,
  path: '/auth/google'
};

const secret = () => process.env.OAUTH_STATE_SECRET || process.env.JWT_SECRET;
const signFlow = (payload) => jwt.sign(payload, secret(), {
  expiresIn: FLOW_TTL,
  algorithm: 'HS256',
  issuer: 'pokemongonexus-google-oauth'
});
const verifyFlow = (token) => jwt.verify(token, secret(), {
  algorithms: ['HS256'],
  issuer: 'pokemongonexus-google-oauth'
});
const safeFrontendOrigin = (candidate) =>
  allowedFrontendOrigins.has(candidate) ? candidate : (process.env.FRONTEND_URL || 'http://localhost:3000');
const redirectWithStatus = (res, origin, path, status) =>
  res.redirect(302, `${origin}${path}${path.includes('?') ? '&' : '?'}oauth=${encodeURIComponent(status)}`);
const optionalString = (value, max) => {
  if (value === null || value === undefined || value === '') return { ok: true, value: null };
  if (typeof value !== 'string') return { ok: false };
  const normalized = value.trim();
  return normalized && normalized.length <= max
    ? { ok: true, value: normalized }
    : { ok: false };
};
const parseCoordinates = (value) => {
  if (value === undefined || value === null) return { ok: true, value: value ?? undefined };
  if (typeof value !== 'object') return { ok: false };
  const { latitude, longitude } = value;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { ok: false };
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return { ok: false };
  return { ok: true, value: { latitude, longitude } };
};

router.get('/google', (req, res) => {
  try {
    const deviceId = typeof req.query.device_id === 'string' ? req.query.device_id.trim() : '';
    if (deviceId.length < 3 || deviceId.length > 128) {
      return res.status(400).json({ message: 'Invalid device_id' });
    }

    const returnOrigin = safeFrontendOrigin(req.query.return_to);
    const nonce = crypto.randomBytes(24).toString('base64url');
    const state = signFlow({ nonce, deviceId, returnOrigin });
    res.cookie(STATE_COOKIE, state, cookieOptions);
    return res.redirect(302, googleOAuth.createAuthorizationUrl({ state, nonce }));
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Unable to start Google login.' });
  }
});

router.get('/google/callback', async (req, res) => {
  let flow;
  try {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!state || state !== req.cookies[STATE_COOKIE]) throw new Error('OAuth state mismatch.');
    flow = verifyFlow(state);
    res.clearCookie(STATE_COOKIE, { ...cookieOptions, maxAge: undefined });

    if (typeof req.query.code !== 'string') throw new Error('Google authorization was not completed.');
    const googleIdentity = await googleOAuth.exchangeCode(req.query.code, flow.nonce);
    const identityQuery = {
      identities: { $elemMatch: { provider: 'google', subject: googleIdentity.subject } }
    };
    const user = await User.findOne(identityQuery);

    if (user) {
      const tokens = await createSession(User, user, flow.deviceId);
      req.accessToken = tokens.accessToken;
      req.refreshToken = tokens.refreshToken;
      return setCookies(req, res, () =>
        redirectWithStatus(res, flow.returnOrigin, '/login', 'success')
      );
    }

    const emailOwner = await User.findOne({ email: googleIdentity.email });
    if (emailOwner) {
      return redirectWithStatus(res, flow.returnOrigin, '/login', 'link-required');
    }

    res.cookie(PENDING_COOKIE, signFlow({
      provider: 'google',
      subject: googleIdentity.subject,
      email: googleIdentity.email,
      emailVerified: true,
      deviceId: flow.deviceId
    }), cookieOptions);
    return redirectWithStatus(res, flow.returnOrigin, '/register', 'google');
  } catch (error) {
    logger.warn(`Google OAuth callback failed: ${error.message}`);
    return redirectWithStatus(
      res,
      safeFrontendOrigin(flow?.returnOrigin),
      '/login',
      'failed'
    );
  }
});

router.get('/google/pending', (req, res) => {
  try {
    const pending = verifyFlow(req.cookies[PENDING_COOKIE] || '');
    if (pending.provider !== 'google') throw new Error('Invalid provider.');
    return res.json({ provider: 'google', email: pending.email, emailVerified: true });
  } catch {
    return res.status(401).json({ message: 'Google registration has expired. Please try again.' });
  }
});

router.post('/google/complete-registration', async (req, res, next) => {
  try {
    const pending = verifyFlow(req.cookies[PENDING_COOKIE] || '');
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const pokemonGoNameResult = optionalString(req.body?.pokemonGoName, 64);
    const pokemonGoName = pokemonGoNameResult.value;
    const trainerCode = typeof req.body?.trainerCode === 'string' ? req.body.trainerCode.replace(/\s+/g, '') || null : null;
    const locationResult = optionalString(req.body?.location, 255);
    const location = locationResult.value;
    const allowLocation = req.body?.allowLocation ?? false;
    const coordinatesResult = parseCoordinates(req.body?.coordinates);

    if (pending.provider !== 'google' || !/^[A-Za-z0-9_]{3,15}$/.test(username)) {
      return res.status(400).json({ message: 'Invalid Google registration' });
    }
    if (!pokemonGoNameResult.ok) return res.status(400).json({ message: 'Invalid pokemonGoName' });
    if (trainerCode && !TRAINER_CODE_RE.test(trainerCode)) {
      return res.status(400).json({ message: 'Invalid Trainer Code' });
    }
    if (!locationResult.ok) return res.status(400).json({ message: 'Invalid location' });
    if (typeof allowLocation !== 'boolean') {
      return res.status(400).json({ message: 'allowLocation must be boolean' });
    }
    if (!coordinatesResult.ok) return res.status(400).json({ message: 'Invalid coordinates' });
    if (await User.findOne({ username })) return res.status(409).json({ message: 'Username already exists' });
    if (await User.findOne({ email: pending.email })) return res.status(409).json({ message: 'Email already exists' });
    if (pokemonGoName && await User.findOne({ pokemonGoName })) {
      return res.status(409).json({ message: 'Pokémon Go name already exists' });
    }
    if (trainerCode && await User.findOne({ trainerCode })) {
      return res.status(409).json({ message: 'Trainer Code already exists' });
    }

    const user = await new User({
      username,
      email: pending.email,
      pokemonGoName,
      trainerCode,
      allowLocation,
      location,
      ...(coordinatesResult.value !== undefined && { coordinates: coordinatesResult.value }),
      googleId: pending.subject,
      identities: [{
        provider: 'google',
        subject: pending.subject,
        email: pending.email,
        emailVerified: true
      }]
    }).save({ writeConcern: { w: 'majority' } });

    const tokens = await createSession(User, user, pending.deviceId);
    req.accessToken = tokens.accessToken;
    req.refreshToken = tokens.refreshToken;
    res.locals.user = user;
    res.locals.tokens = tokens;
    res.clearCookie(PENDING_COOKIE, { ...cookieOptions, maxAge: undefined });
    next();
  } catch (error) {
    logger.warn(`Google registration failed: ${error.message}`);
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'That account information is already in use.' });
    }
    return res.status(401).json({ message: 'Google registration has expired. Please try again.' });
  }
}, setCookies, (req, res) => {
  const { user, tokens } = res.locals;
  return res.status(201).json({
    user_id: user._id.toString(),
    username: user.username,
    email: user.email,
    pokemonGoName: user.pokemonGoName,
    trainerCode: user.trainerCode,
    allowLocation: user.allowLocation,
    location: user.location,
    coordinates: user.coordinates,
    accessTokenExpiry: tokens.accessTokenExpiry.toISOString(),
    refreshTokenExpiry: tokens.refreshTokenExpiry.toISOString(),
    message: 'Google account created successfully'
  });
});

module.exports = router;
