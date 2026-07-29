const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/googleOAuthService', () => ({
  createAuthorizationUrl: jest.fn(({ state }) => `https://accounts.google.test/authorize?state=${encodeURIComponent(state)}`),
  exchangeCode: jest.fn(async () => ({
    subject: 'google-subject-123',
    email: 'google.user@example.com',
    emailVerified: true
  }))
}));

jest.mock('../services/discordOAuthService', () => ({
  createAuthorizationUrl: jest.fn(({ state }) =>
    `https://discord.test/oauth2/authorize?state=${encodeURIComponent(state)}`),
  exchangeCode: jest.fn(async () => ({
    subject: 'discord-subject-456',
    email: 'discord.user@example.com',
    emailVerified: true
  }))
}));

jest.mock('../services/facebookOAuthService', () => ({
  createAuthorizationUrl: jest.fn(({ state }) =>
    `https://facebook.test/dialog/oauth?state=${encodeURIComponent(state)}`),
  exchangeCode: jest.fn(async () => ({
    subject: 'facebook-subject-789',
    email: 'facebook.user@example.com',
    emailVerified: true
  }))
}));

jest.setTimeout(120000);

let mongoServer;
let app;
let mongoConnectionPromise;
let User;
let validLoginId;
let validEmail;
let validPassphrase;
let validDeviceId;

function buildRegisterPayload(overrides = {}) {
  return {
    username: validLoginId,
    email: validEmail,
    password: validPassphrase,
    device_id: validDeviceId,
    ...overrides
  };
}

async function registerUser(payload = {}) {
  return request(app).post('/auth/register').send(buildRegisterPayload(payload));
}

describe('authentication service integration', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('auth_test');

    ({ app, mongoConnectionPromise } = require('../app'));
    await mongoConnectionPromise;

    User = require('../models/user');
  });

  beforeEach(() => {
    const seed = Date.now().toString(36);
    validLoginId = `ci_user_${seed}`;
    validEmail = `ci_${seed}@example.invalid`;
    validPassphrase = `ci_pass_${seed}_ok`;
    validDeviceId = `ci_device_${seed}`;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  test('register creates user, hashes password, and sets auth cookies', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Account created successfully.');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'].some((c) => c.startsWith('accessToken='))).toBe(true);
    expect(res.headers['set-cookie'].some((c) => c.startsWith('refreshToken='))).toBe(true);

    const user = await User.findOne({ username: validLoginId }).lean();
    expect(user).toBeTruthy();
    expect(user.password).not.toBe(validPassphrase);
    expect(Array.isArray(user.refreshToken)).toBe(true);
    expect(user.refreshToken.length).toBe(1);
  });

  test('register rejects duplicate username', async () => {
    await registerUser();
    const second = await registerUser({ email: 'new@example.com' });

    expect(second.status).toBe(409);
    expect(second.body.message).toBe('Username already exists');
  });

  test('login succeeds with valid credentials and sets cookies', async () => {
    await registerUser();

    const login = await request(app).post('/auth/login').send({
      username: validLoginId,
      password: validPassphrase,
      device_id: validDeviceId
    });

    expect(login.status).toBe(200);
    expect(login.body.message).toBe('Logged in successfully');
    expect(login.headers['set-cookie']).toBeDefined();
    expect(login.headers['set-cookie'].some((c) => c.startsWith('refreshToken='))).toBe(true);
  });

  test('refresh succeeds with valid refresh token cookie', async () => {
    await registerUser();

    const login = await request(app).post('/auth/login').send({
      username: validLoginId,
      password: validPassphrase,
      device_id: validDeviceId
    });

    const cookies = login.headers['set-cookie'];
    const refreshed = await request(app)
      .post('/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', cookies)
      .send({});

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.username).toBe(validLoginId);
    expect(refreshed.headers['set-cookie']).toBeDefined();
    expect(refreshed.headers['set-cookie'].some((c) => c.startsWith('accessToken='))).toBe(true);

    const refreshUsingOldCookie = await request(app)
      .post('/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', cookies)
      .send({});
    expect(refreshUsingOldCookie.status).toBe(401);
  });

  test('logout revokes refresh token and blocks future refresh', async () => {
    await registerUser();

    const login = await request(app).post('/auth/login').send({
      username: validLoginId,
      password: validPassphrase,
      device_id: validDeviceId
    });
    const cookies = login.headers['set-cookie'];

    const logout = await request(app)
      .post('/auth/logout')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', cookies)
      .send({});
    expect(logout.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', cookies)
      .send({});
    expect(refreshAfterLogout.status).toBe(401);
  });

  test('login fails with invalid password', async () => {
    await registerUser();

    const badLogin = await request(app).post('/auth/login').send({
      username: validLoginId,
      password: 'invalid_passphrase_for_ci',
      device_id: validDeviceId
    });

    expect(badLogin.status).toBe(401);
    expect(badLogin.body.message).toBe('Invalid credentials');
  });

  test('update rejects unauthenticated request', async () => {
    await registerUser();
    const user = await User.findOne({ username: validLoginId }).lean();

    const update = await request(app).put(`/auth/update/${user._id}`).send({
      location: 'Pallet Town'
    });

    expect(update.status).toBe(401);
    expect(update.body.message).toBe('Authentication required');
  });

  test('update forbids modifying another user', async () => {
    await registerUser();
    const firstUser = await User.findOne({ username: validLoginId }).lean();

    const secondUsername = `${validLoginId}_other`;
    const secondEmail = `other_${Date.now().toString(36)}@example.invalid`;
    const secondPass = `${validPassphrase}_x`;
    const secondDevice = `${validDeviceId}_other`;

    await registerUser({
      username: secondUsername,
      email: secondEmail,
      password: secondPass,
      device_id: secondDevice
    });

    const secondUser = await User.findOne({ username: secondUsername }).lean();

    const login = await request(app).post('/auth/login').send({
      username: firstUser.username,
      password: validPassphrase,
      device_id: validDeviceId
    });
    const cookies = login.headers['set-cookie'];

    const update = await request(app)
      .put(`/auth/update/${secondUser._id}`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', cookies)
      .send({ location: 'Viridian City' });

    expect(update.status).toBe(403);
    expect(update.body.message).toBe('Forbidden');
  });

  test('delete forbids removing another user', async () => {
    await registerUser();
    const firstUser = await User.findOne({ username: validLoginId }).lean();

    const secondUsername = `${validLoginId}_target`;
    const secondEmail = `target_${Date.now().toString(36)}@example.invalid`;
    const secondPass = `${validPassphrase}_target`;
    const secondDevice = `${validDeviceId}_target`;

    await registerUser({
      username: secondUsername,
      email: secondEmail,
      password: secondPass,
      device_id: secondDevice
    });

    const secondUser = await User.findOne({ username: secondUsername }).lean();

    const login = await request(app).post('/auth/login').send({
      username: firstUser.username,
      password: validPassphrase,
      device_id: validDeviceId
    });
    const cookies = login.headers['set-cookie'];

    const deletion = await request(app)
      .delete(`/auth/delete/${secondUser._id}`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', cookies)
      .send();

    expect(deletion.status).toBe(403);
    expect(deletion.body.message).toBe('Forbidden');
  });

  test('csrf origin guard blocks mutating auth-cookie request without origin', async () => {
    await registerUser();

    const login = await request(app).post('/auth/login').send({
      username: validLoginId,
      password: validPassphrase,
      device_id: validDeviceId
    });
    const cookies = login.headers['set-cookie'];

    const refreshNoOrigin = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookies)
      .send({});

    expect(refreshNoOrigin.status).toBe(403);
    expect(refreshNoOrigin.body.message).toBe('CSRF origin check failed');
  });

  test('reset-password endpoint remains intentionally disabled', async () => {
    const res = await request(app).post('/auth/reset-password/').send({
      token: 'unused',
      newPassword: 'unused-password'
    });

    expect(res.status).toBe(501);
    expect(res.body.message).toBe('Password reset is not enabled for this environment.');
  });

  test('metrics endpoint exposes Prometheus metrics', async () => {
    await registerUser();

    const res = await request(app).get('/metrics');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });

  test('Google OAuth starts with a state cookie and authorization redirect', async () => {
    const res = await request(app)
      .get('/auth/google')
      .query({
        device_id: validDeviceId,
        return_to: 'http://localhost:3000'
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('https://accounts.google.test/authorize');
    expect(res.headers['set-cookie'].some((cookie) => cookie.startsWith('googleOAuthState='))).toBe(true);
    expect(res.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('googleOAuthState='))).toContain('Path=/');
  });

  test('Google OAuth creates a pending registration and completes it without a password', async () => {
    const start = await request(app)
      .get('/auth/google')
      .query({
        device_id: validDeviceId,
        return_to: 'http://localhost:3000',
        intent: 'register'
      });
    const stateCookie = start.headers['set-cookie'].find((cookie) => cookie.startsWith('googleOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');

    const callback = await request(app)
      .get('/auth/google/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'google-code', state });

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe('http://localhost:3000/register?oauth=google');
    const pendingCookie = callback.headers['set-cookie'].find((cookie) => cookie.startsWith('googleOAuthPending='));
    expect(pendingCookie).toBeDefined();

    const pending = await request(app)
      .get('/auth/google/pending')
      .set('Cookie', pendingCookie);
    expect(pending.status).toBe(200);
    expect(pending.body).toEqual({
      provider: 'google',
      email: 'google.user@example.com',
      emailVerified: true
    });

    const completed = await request(app)
      .post('/auth/google/complete-registration')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', pendingCookie)
      .send({ username: 'google_user' });

    expect(completed.status).toBe(201);
    expect(completed.headers['set-cookie'].some((cookie) => cookie.startsWith('accessToken='))).toBe(true);
    const user = await User.findOne({ username: 'google_user' }).lean();
    expect(user.password).toBeFalsy();
    expect(user.identities).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: 'google', subject: 'google-subject-123' })
    ]));
  });

  test('Google OAuth logs in an existing linked identity', async () => {
    await User.create({
      username: validLoginId,
      email: 'google.user@example.com',
      identities: [{
        provider: 'google',
        subject: 'google-subject-123',
        email: 'google.user@example.com',
        emailVerified: true
      }]
    });
    const start = await request(app)
      .get('/auth/google')
      .query({ device_id: validDeviceId, return_to: 'http://localhost:3000' });
    const stateCookie = start.headers['set-cookie'].find((cookie) => cookie.startsWith('googleOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');

    const callback = await request(app)
      .get('/auth/google/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'google-code', state });

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe('http://localhost:3000/login?oauth=success');
    expect(callback.headers['set-cookie'].some((cookie) => cookie.startsWith('refreshToken='))).toBe(true);
  });

  test('Google registration rejects an already-linked identity without logging it in', async () => {
    await User.create({
      username: validLoginId,
      email: 'google.user@example.com',
      identities: [{
        provider: 'google',
        subject: 'google-subject-123',
        email: 'google.user@example.com',
        emailVerified: true
      }]
    });
    const start = await request(app).get('/auth/google').query({
      device_id: validDeviceId,
      return_to: 'http://localhost:3000',
      intent: 'register'
    });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('googleOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app).get('/auth/google/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'google-code', state });

    expect(callback.headers.location).toBe('http://localhost:3000/login?oauth=account-exists');
    expect(callback.headers['set-cookie']?.some((cookie) =>
      cookie.startsWith('refreshToken='))).not.toBe(true);
  });

  test('Google login directs an unknown account to registration without creating pending state', async () => {
    const start = await request(app).get('/auth/google').query({
      device_id: validDeviceId,
      return_to: 'http://localhost:3000',
      intent: 'login'
    });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('googleOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app).get('/auth/google/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'google-code', state });

    expect(callback.headers.location).toBe('http://localhost:3000/register?oauth=account-not-found');
    expect(callback.headers['set-cookie']?.some((cookie) =>
      cookie.startsWith('googleOAuthPending='))).not.toBe(true);
  });

  test('Google OAuth links a verified matching email to the existing password account', async () => {
    await registerUser({ email: 'google.user@example.com' });
    const existingUser = await User.findOne({ email: 'google.user@example.com' }).lean();
    const start = await request(app)
      .get('/auth/google')
      .query({ device_id: validDeviceId, return_to: 'http://localhost:3000' });
    const stateCookie = start.headers['set-cookie'].find((cookie) => cookie.startsWith('googleOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');

    const callback = await request(app)
      .get('/auth/google/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'google-code', state });

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe('http://localhost:3000/login?oauth=success');
    expect(callback.headers['set-cookie'].some((cookie) => cookie.startsWith('refreshToken='))).toBe(true);

    const linkedUser = await User.findOne({ email: 'google.user@example.com' }).lean();
    expect(linkedUser._id.toString()).toBe(existingUser._id.toString());
    expect(linkedUser.identities).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: 'google',
        subject: 'google-subject-123',
        email: 'google.user@example.com',
        emailVerified: true
      })
    ]));

    const passwordLogin = await request(app).post('/auth/login').send({
      username: 'google.user@example.com',
      password: validPassphrase,
      device_id: `${validDeviceId}-password`
    });
    expect(passwordLogin.status).toBe(200);
  });

  test('Google registration rejects a verified email that already has an account', async () => {
    await registerUser({ email: 'google.user@example.com' });
    const start = await request(app)
      .get('/auth/google')
      .query({
        device_id: validDeviceId,
        return_to: 'http://localhost:3000',
        intent: 'register'
      });
    const stateCookie = start.headers['set-cookie'].find((cookie) => cookie.startsWith('googleOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');

    const callback = await request(app)
      .get('/auth/google/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'google-code', state });

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe('http://localhost:3000/login?oauth=account-exists');
    expect(callback.headers['set-cookie']?.some((cookie) => cookie.startsWith('refreshToken='))).not.toBe(true);

    const existingUser = await User.findOne({ email: 'google.user@example.com' }).lean();
    expect(existingUser.identities).toHaveLength(0);
    expect(await User.countDocuments({ email: 'google.user@example.com' })).toBe(1);
  });

  test('Discord OAuth creates and completes a pending registration', async () => {
    const start = await request(app)
      .get('/auth/discord')
      .query({
        device_id: validDeviceId,
        return_to: 'http://localhost:3000',
        intent: 'register'
      });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('discordOAuthState='));
    expect(stateCookie).toContain('Path=/');
    const state = new URL(start.headers.location).searchParams.get('state');

    const callback = await request(app)
      .get('/auth/discord/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'discord-code', state });

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe('http://localhost:3000/register?oauth=discord');
    const pendingCookie = callback.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('discordOAuthPending='));

    const pending = await request(app)
      .get('/auth/discord/pending')
      .set('Cookie', pendingCookie);
    expect(pending.body).toEqual({
      provider: 'discord',
      email: 'discord.user@example.com',
      emailVerified: true
    });

    const completed = await request(app)
      .post('/auth/discord/complete-registration')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', pendingCookie)
      .send({ username: 'discord_user' });
    expect(completed.status).toBe(201);
    const user = await User.findOne({ username: 'discord_user' }).lean();
    expect(user.identities).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: 'discord',
        subject: 'discord-subject-456'
      })
    ]));
  });

  test('Discord login unifies a verified matching email account', async () => {
    await registerUser({ email: 'discord.user@example.com' });
    const existing = await User.findOne({ email: 'discord.user@example.com' }).lean();
    const start = await request(app)
      .get('/auth/discord')
      .query({ device_id: validDeviceId, return_to: 'http://localhost:3000' });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('discordOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');

    const callback = await request(app)
      .get('/auth/discord/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'discord-code', state });

    expect(callback.headers.location).toBe('http://localhost:3000/login?oauth=success');
    const linked = await User.findOne({ email: 'discord.user@example.com' }).lean();
    expect(linked._id.toString()).toBe(existing._id.toString());
    expect(linked.identities).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: 'discord',
        subject: 'discord-subject-456'
      })
    ]));
  });

  test('Discord registration rejects an email that already has an account', async () => {
    await registerUser({ email: 'discord.user@example.com' });
    const start = await request(app)
      .get('/auth/discord')
      .query({
        device_id: validDeviceId,
        return_to: 'http://localhost:3000',
        intent: 'register'
      });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('discordOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');

    const callback = await request(app)
      .get('/auth/discord/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'discord-code', state });

    expect(callback.headers.location).toBe(
      'http://localhost:3000/login?oauth=account-exists'
    );
    const existing = await User.findOne({ email: 'discord.user@example.com' }).lean();
    expect(existing.identities).toHaveLength(0);
  });

  test('Discord registration rejects an already-linked identity without logging it in', async () => {
    await User.create({
      username: validLoginId,
      email: 'discord.user@example.com',
      identities: [{
        provider: 'discord',
        subject: 'discord-subject-456',
        email: 'discord.user@example.com',
        emailVerified: true
      }]
    });
    const start = await request(app).get('/auth/discord').query({
      device_id: validDeviceId,
      return_to: 'http://localhost:3000',
      intent: 'register'
    });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('discordOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app).get('/auth/discord/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'discord-code', state });

    expect(callback.headers.location).toBe('http://localhost:3000/login?oauth=account-exists');
    expect(callback.headers['set-cookie']?.some((cookie) =>
      cookie.startsWith('refreshToken='))).not.toBe(true);
  });

  test('Discord login directs an unknown account to registration', async () => {
    const start = await request(app).get('/auth/discord').query({
      device_id: validDeviceId,
      return_to: 'http://localhost:3000',
      intent: 'login'
    });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('discordOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app).get('/auth/discord/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'discord-code', state });

    expect(callback.headers.location).toBe('http://localhost:3000/register?oauth=account-not-found');
  });

  test('Facebook OAuth creates and completes a pending registration', async () => {
    const start = await request(app)
      .get('/auth/facebook')
      .query({
        device_id: validDeviceId,
        return_to: 'http://localhost:3000',
        intent: 'register'
      });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('facebookOAuthState='));
    expect(stateCookie).toContain('Path=/');
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app)
      .get('/auth/facebook/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'facebook-code', state });

    expect(callback.headers.location).toBe(
      'http://localhost:3000/register?oauth=facebook'
    );
    const pendingCookie = callback.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('facebookOAuthPending='));
    const completed = await request(app)
      .post('/auth/facebook/complete-registration')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', pendingCookie)
      .send({ username: 'facebook_user' });

    expect(completed.status).toBe(201);
    const user = await User.findOne({ username: 'facebook_user' }).lean();
    expect(user.identities).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: 'facebook',
        subject: 'facebook-subject-789'
      })
    ]));
  });

  test('Facebook OAuth can return a direct authorization URL for standalone PWAs', async () => {
    const start = await request(app)
      .get('/auth/facebook')
      .query({
        device_id: validDeviceId,
        return_to: 'http://localhost:3000',
        intent: 'register',
        response_mode: 'json'
      });

    expect(start.status).toBe(200);
    expect(start.body.authorizationUrl).toMatch(/^https:\/\/facebook\.test\/dialog\/oauth\?/);
    expect(new URL(start.body.authorizationUrl).searchParams.get('state')).toBeTruthy();
    expect(start.headers['set-cookie'].some((cookie) =>
      cookie.startsWith('facebookOAuthState='))).toBe(true);
  });

  test('Facebook login unifies a matching email account', async () => {
    await registerUser({ email: 'facebook.user@example.com' });
    const existing = await User.findOne({ email: 'facebook.user@example.com' }).lean();
    const start = await request(app)
      .get('/auth/facebook')
      .query({ device_id: validDeviceId, return_to: 'http://localhost:3000' });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('facebookOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app)
      .get('/auth/facebook/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'facebook-code', state });

    expect(callback.headers.location).toBe('http://localhost:3000/login?oauth=success');
    const linked = await User.findOne({ email: 'facebook.user@example.com' }).lean();
    expect(linked._id.toString()).toBe(existing._id.toString());
    expect(linked.identities).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: 'facebook',
        subject: 'facebook-subject-789'
      })
    ]));
  });

  test('Facebook registration rejects an email that already has an account', async () => {
    await User.create({
      username: validLoginId,
      email: 'facebook.user@example.com',
      password: 'existing-password-hash'
    });
    const start = await request(app)
      .get('/auth/facebook')
      .query({
        device_id: validDeviceId,
        return_to: 'http://localhost:3000',
        intent: 'register'
      });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('facebookOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app)
      .get('/auth/facebook/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'facebook-code', state });

    expect(callback.headers.location).toBe(
      'http://localhost:3000/login?oauth=account-exists'
    );
    const existing = await User.findOne({ email: 'facebook.user@example.com' }).lean();
    expect(existing.identities).toHaveLength(0);
  });

  test('Facebook registration rejects an already-linked identity without logging it in', async () => {
    await User.create({
      username: validLoginId,
      email: 'facebook.user@example.com',
      identities: [{
        provider: 'facebook',
        subject: 'facebook-subject-789',
        email: 'facebook.user@example.com',
        emailVerified: true
      }]
    });
    const start = await request(app).get('/auth/facebook').query({
      device_id: validDeviceId,
      return_to: 'http://localhost:3000',
      intent: 'register'
    });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('facebookOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app).get('/auth/facebook/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'facebook-code', state });

    expect(callback.headers.location).toBe('http://localhost:3000/login?oauth=account-exists');
    expect(callback.headers['set-cookie']?.some((cookie) =>
      cookie.startsWith('refreshToken='))).not.toBe(true);
  });

  test('Facebook login directs an unknown account to registration', async () => {
    const start = await request(app).get('/auth/facebook').query({
      device_id: validDeviceId,
      return_to: 'http://localhost:3000',
      intent: 'login'
    });
    const stateCookie = start.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('facebookOAuthState='));
    const state = new URL(start.headers.location).searchParams.get('state');
    const callback = await request(app).get('/auth/facebook/callback')
      .set('Cookie', stateCookie)
      .query({ code: 'facebook-code', state });

    expect(callback.headers.location).toBe('http://localhost:3000/register?oauth=account-not-found');
  });

  for (const provider of ['google', 'discord', 'facebook']) {
    test(`${provider} OAuth registration can immediately delete its own account`, async () => {
      const start = await request(app)
        .get(`/auth/${provider}`)
        .query({
          device_id: validDeviceId,
          return_to: 'http://localhost:3000',
          intent: 'register'
        });
      const stateCookie = start.headers['set-cookie'].find((cookie) =>
        cookie.startsWith(`${provider}OAuthState=`));
      const state = new URL(start.headers.location).searchParams.get('state');
      const callback = await request(app)
        .get(`/auth/${provider}/callback`)
        .set('Cookie', stateCookie)
        .query({ code: `${provider}-code`, state });
      const pendingCookie = callback.headers['set-cookie'].find((cookie) =>
        cookie.startsWith(`${provider}OAuthPending=`));

      const completed = await request(app)
        .post(`/auth/${provider}/complete-registration`)
        .set('Origin', 'http://localhost:3000')
        .set('Cookie', pendingCookie)
        .send({ username: `delete_${provider}` });

      expect(completed.status).toBe(201);
      const user = await User.findOne({ username: `delete_${provider}` }).lean();
      expect(user).toBeTruthy();

      const deletion = await request(app)
        .delete(`/auth/delete/${user._id}`)
        .set('Origin', 'http://localhost:3000')
        .set('Cookie', completed.headers['set-cookie']);

      expect(deletion.status).toBe(200);
      expect(await User.findById(user._id)).toBeNull();

      const refresh = await request(app)
        .post('/auth/refresh')
        .set('Origin', 'http://localhost:3000')
        .set('Cookie', completed.headers['set-cookie'])
        .send({});
      expect(refresh.status).toBe(401);
    });
  }
});
