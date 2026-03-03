import {
  reportCrash,
  resetCrashReportCountForTests,
} from '../../../src/observability/crashReporter';
import { requestWithPolicy } from '../../../src/services/httpClient';

jest.mock('../../../src/services/httpClient', () => ({
  requestWithPolicy: jest.fn().mockResolvedValue({ ok: true, status: 200 }),
}));

jest.mock('../../../src/config/runtimeConfig', () => ({
  runtimeConfig: {
    api: {
      authApiUrl: '',
      usersApiUrl: '',
      searchApiUrl: '',
      pokemonApiUrl: '',
      locationApiUrl: '',
      eventsApiUrl: '',
      receiverApiUrl: '',
    },
    observability: {
      crashReportUrl: 'https://example.com/crash',
      crashReportApiKey: 'abc123',
      appEnv: 'production',
      appRelease: 'mobile@9.9.9',
    },
    realtime: {
      allowAccessTokenQueryFallback: false,
    },
  },
}));

const mockedRequestWithPolicy = requestWithPolicy as jest.MockedFunction<typeof requestWithPolicy>;

describe('crashReporter', () => {
  const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    resetCrashReportCountForTests();
  });

  afterAll(() => {
    Object.defineProperty(globalThis, '__DEV__', {
      value: originalDev,
      configurable: true,
      writable: true,
    });
  });

  it('posts crash payload when running in production mode', async () => {
    Object.defineProperty(globalThis, '__DEV__', {
      value: false,
      configurable: true,
      writable: true,
    });

    await reportCrash('runtime_error', new Error('boom'), {
      fatal: true,
      metadata: { scope: 'test' },
    });

    expect(mockedRequestWithPolicy).toHaveBeenCalledTimes(1);
    expect(mockedRequestWithPolicy).toHaveBeenCalledWith(
      'https://example.com/crash',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Crash-Report-Key': 'abc123',
        }),
      }),
    );
  });

  it('skips crash reporting in dev mode', async () => {
    Object.defineProperty(globalThis, '__DEV__', {
      value: true,
      configurable: true,
      writable: true,
    });

    await reportCrash('manual_report', 'ignore in dev');
    expect(mockedRequestWithPolicy).not.toHaveBeenCalled();
  });
});
