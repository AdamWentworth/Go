// src/setupTests.js
import '@testing-library/jest-dom';
import { server } from './mocks/server.js';

// Polyfills
import { TextEncoder, TextDecoder } from 'node:util';
import { TransformStream } from 'web-streams-polyfill';

import 'jest-localstorage-mock';
import 'fake-indexeddb/auto';

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
      value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
      },
      writable: true,
  });
});

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {}); // Suppress logs
  jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress errors
});

beforeAll(() => {
  process.env.REACT_APP_AUTH_API_URL = 'http://localhost:3002/auth';
});

afterEach(() => {
  jest.restoreAllMocks(); // Restore original console behavior after each test
});

// Reset all mocks before each test to prevent state leakage
beforeEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

// Globally define polyfills
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
globalThis.TransformStream = TransformStream;

// Mock BroadcastChannel
class MockBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

globalThis.BroadcastChannel = MockBroadcastChannel;

// MSW Server setup
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
