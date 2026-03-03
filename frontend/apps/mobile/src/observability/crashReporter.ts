import { requestWithPolicy } from '../services/httpClient';
import { runtimeConfig } from '../config/runtimeConfig';
import { logDebug, logWarn } from './logger';

type CrashEventKind =
  | 'runtime_error'
  | 'react_error_boundary'
  | 'unhandled_rejection'
  | 'manual_report';

type CrashEventPayload = {
  kind: CrashEventKind;
  message: string;
  stack?: string;
  fatal?: boolean;
  metadata?: Record<string, unknown>;
  timestamp: number;
  release: string;
  environment: string;
};

const MAX_REPORTS_PER_SESSION = 20;
let reportCount = 0;

const shouldReport = (): boolean => {
  if (__DEV__) return false;
  if (!runtimeConfig.observability.crashReportUrl) return false;
  if (reportCount >= MAX_REPORTS_PER_SESSION) return false;
  return true;
};

const normalizeError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message || 'Unknown error',
      stack: error.stack,
    };
  }
  return {
    message: typeof error === 'string' ? error : 'Unknown non-error throw',
  };
};

const toPayload = (
  kind: CrashEventKind,
  error: unknown,
  options?: { fatal?: boolean; metadata?: Record<string, unknown> },
): CrashEventPayload => {
  const normalized = normalizeError(error);
  return {
    kind,
    message: normalized.message,
    stack: normalized.stack,
    fatal: options?.fatal,
    metadata: options?.metadata,
    timestamp: Date.now(),
    release: runtimeConfig.observability.appRelease,
    environment: runtimeConfig.observability.appEnv,
  };
};

const readReportUrl = (): string | null => runtimeConfig.observability.crashReportUrl;

const readHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const apiKey = runtimeConfig.observability.crashReportApiKey;
  if (apiKey) {
    headers['X-Crash-Report-Key'] = apiKey;
  }
  return headers;
};

export const reportCrash = async (
  kind: CrashEventKind,
  error: unknown,
  options?: { fatal?: boolean; metadata?: Record<string, unknown> },
): Promise<void> => {
  if (!shouldReport()) {
    logDebug('crash-report', 'Skipping crash report (disabled or unavailable)');
    return;
  }

  const crashReportUrl = readReportUrl();
  if (!crashReportUrl) return;

  const payload = toPayload(kind, error, options);

  try {
    await requestWithPolicy(crashReportUrl, {
      method: 'POST',
      headers: readHeaders(),
      body: JSON.stringify(payload),
      retryCount: 0,
      timeoutMs: 5000,
      credentials: 'omit',
    });
    reportCount += 1;
  } catch (nextError) {
    logWarn('crash-report', 'Failed to send crash report payload', nextError);
  }
};

export const resetCrashReportCountForTests = (): void => {
  reportCount = 0;
};
