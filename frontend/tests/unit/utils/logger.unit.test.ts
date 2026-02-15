import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('logger', () => {
  type ConsoleMock = {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  let consoleMock: ConsoleMock;

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    consoleMock = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    vi.stubGlobal('console', {
      ...console,
      debug: consoleMock.debug,
      info: consoleMock.info,
      warn: consoleMock.warn,
      error: consoleMock.error,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('emits only error logs at error level', async () => {
    vi.stubEnv('VITE_LOG_LEVEL', 'error');
    vi.stubEnv('VITE_VERBOSE_LOGS', 'false');

    const { logger } = await import('@/utils/logger');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(consoleMock.debug).not.toHaveBeenCalled();
    expect(consoleMock.info).not.toHaveBeenCalled();
    expect(consoleMock.warn).not.toHaveBeenCalled();
    expect(consoleMock.error).toHaveBeenCalledWith('error');
  });

  it('does not emit debug logs unless debug flag is enabled', async () => {
    vi.stubEnv('VITE_LOG_LEVEL', 'debug');
    vi.stubEnv('VITE_VERBOSE_LOGS', 'false');

    const { logger } = await import('@/utils/logger');
    logger.debug('debug');
    logger.info('info');

    expect(consoleMock.debug).not.toHaveBeenCalled();
    expect(consoleMock.info).toHaveBeenCalledWith('info');
  });

  it('emits debug logs when debug level and verbose flag are enabled', async () => {
    vi.stubEnv('VITE_LOG_LEVEL', 'debug');
    vi.stubEnv('VITE_VERBOSE_LOGS', 'true');

    const { logger } = await import('@/utils/logger');
    logger.debug('debug message');

    expect(consoleMock.debug).toHaveBeenCalledWith('debug message');
  });

  it('prefixes scoped logger entries', async () => {
    vi.stubEnv('VITE_LOG_LEVEL', 'info');
    vi.stubEnv('VITE_VERBOSE_LOGS', 'false');

    const { createScopedLogger } = await import('@/utils/logger');
    const scoped = createScopedLogger('Scope');

    scoped.info('hello');

    expect(consoleMock.info).toHaveBeenCalledWith('[Scope]', 'hello');
  });

  it('accepts legacy VITE_DEBUG_LOGS flag for compatibility', async () => {
    vi.stubEnv('VITE_LOG_LEVEL', 'debug');
    vi.stubEnv('VITE_DEBUG_LOGS', 'true');

    const { logger } = await import('@/utils/logger');
    logger.debug('legacy debug');

    expect(consoleMock.debug).toHaveBeenCalledWith('legacy debug');
  });
});
