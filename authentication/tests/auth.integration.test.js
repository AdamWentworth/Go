const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

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
    const refreshed = await request(app).post('/auth/refresh').set('Cookie', cookies).send({});

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.username).toBe(validLoginId);
    expect(refreshed.headers['set-cookie']).toBeDefined();
    expect(refreshed.headers['set-cookie'].some((c) => c.startsWith('accessToken='))).toBe(true);
  });

  test('logout revokes refresh token and blocks future refresh', async () => {
    await registerUser();

    const login = await request(app).post('/auth/login').send({
      username: validLoginId,
      password: validPassphrase,
      device_id: validDeviceId
    });
    const cookies = login.headers['set-cookie'];

    const logout = await request(app).post('/auth/logout').set('Cookie', cookies).send({});
    expect(logout.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/auth/refresh')
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
    expect(badLogin.body.message).toBe('Invalid password');
  });
});
