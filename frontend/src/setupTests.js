// src/setupTests.js
import '@testing-library/jest-dom';
import { server } from './mocks/server.js';

// Polyfills
import { TextEncoder, TextDecoder } from 'node:util';
import { TransformStream } from 'web-streams-polyfill';

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
