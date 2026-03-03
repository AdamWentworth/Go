type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50,
};

const normalizeLogLevel = (value: string | undefined): LogLevel | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'debug') return 'debug';
  if (normalized === 'info') return 'info';
  if (normalized === 'warn') return 'warn';
  if (normalized === 'error') return 'error';
  if (normalized === 'silent') return 'silent';
  return null;
};

const normalizeBoolean = (value: string | undefined): boolean | null => {
  if (value == null) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
};

const verboseOverride = normalizeBoolean(import.meta.env.VITE_VERBOSE_LOGS);
// Legacy compatibility while we migrate from VITE_DEBUG_LOGS.
const legacyDebugOverride = normalizeBoolean(import.meta.env.VITE_DEBUG_LOGS);
const verboseLogsEnabled = verboseOverride ?? legacyDebugOverride ?? import.meta.env.DEV;

const defaultLogLevel: LogLevel =
  import.meta.env.PROD || import.meta.env.MODE === 'test'
    ? 'warn'
    : verboseLogsEnabled
      ? 'debug'
      : 'info';
const configuredLevel =
  normalizeLogLevel(import.meta.env.VITE_LOG_LEVEL) ?? defaultLogLevel;

const shouldEmit = (level: LogLevel): boolean => {
  if (configuredLevel === 'silent') return false;
  if (level === 'debug' && !verboseLogsEnabled) return false;
  return LEVEL_SEVERITY[level] >= LEVEL_SEVERITY[configuredLevel];
};

const emitWithPrefix = (prefix: string | null, args: unknown[]): unknown[] =>
  prefix ? [`[${prefix}]`, ...args] : args;

export const logger = {
  debug(...args: unknown[]) {
    if (shouldEmit('debug')) console.debug(...args);
  },
  info(...args: unknown[]) {
    if (shouldEmit('info')) console.info(...args);
  },
  warn(...args: unknown[]) {
    if (shouldEmit('warn')) console.warn(...args);
  },
  error(...args: unknown[]) {
    if (shouldEmit('error')) console.error(...args);
  },
};

export const createScopedLogger = (scope: string) => ({
  debug(...args: unknown[]) {
    logger.debug(...emitWithPrefix(scope, args));
  },
  info(...args: unknown[]) {
    logger.info(...emitWithPrefix(scope, args));
  },
  warn(...args: unknown[]) {
    logger.warn(...emitWithPrefix(scope, args));
  },
  error(...args: unknown[]) {
    logger.error(...emitWithPrefix(scope, args));
  },
});

export const loggerInternals = {
  normalizeBoolean,
  normalizeLogLevel,
  shouldEmit,
};
