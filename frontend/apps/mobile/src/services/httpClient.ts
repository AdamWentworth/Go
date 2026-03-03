import { getAuthToken } from '../features/auth/authSession';
import { logDebug, logWarn } from '../observability/logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type RequestWithPolicyOptions = Omit<RequestInit, 'signal'> & {
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  retryStatusCodes?: number[];
};

export type HttpErrorData = {
  message: string;
  [key: string]: unknown;
};

export class HttpError extends Error {
  status: number;
  data: HttpErrorData;

  constructor(status: number, data: HttpErrorData) {
    super(data.message || `Request failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export type ConnectivityState = {
  online: boolean;
  lastChangedAt: number;
  lastCheckAt: number | null;
  lastError: string | null;
};

type ConnectivityListener = (state: ConnectivityState) => void;

const connectivityListeners = new Set<ConnectivityListener>();
let connectivityState: ConnectivityState = {
  online: true,
  lastChangedAt: Date.now(),
  lastCheckAt: null,
  lastError: null,
};

const emitConnectivityState = (): void => {
  for (const listener of connectivityListeners) {
    listener(connectivityState);
  }
};

const setConnectivityState = (online: boolean, lastError: string | null): void => {
  const now = Date.now();
  const changed =
    connectivityState.online !== online || connectivityState.lastError !== lastError;
  connectivityState = {
    online,
    lastChangedAt: connectivityState.online === online ? connectivityState.lastChangedAt : now,
    lastCheckAt: now,
    lastError,
  };
  if (changed) {
    emitConnectivityState();
  }
};

export const getConnectivityState = (): ConnectivityState => connectivityState;

export const subscribeConnectivity = (listener: ConnectivityListener): (() => void) => {
  connectivityListeners.add(listener);
  listener(connectivityState);
  return () => {
    connectivityListeners.delete(listener);
  };
};

const buildUrl = (
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): string => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(normalizedPath, normalizedBase);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

const normalizeErrorData = (status: number, payload: unknown): HttpErrorData => {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return payload as HttpErrorData;
    }
  }
  return { message: `Request failed with status ${status}` };
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY_MS = 350;
const DEFAULT_RETRY_STATUS_CODES = [408, 425, 429, 500, 502, 503, 504];

const wait = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isAbortError = (error: unknown): boolean =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError',
  );

export const parseJsonSafe = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const requestWithPolicy = async (
  input: string | URL,
  options: RequestWithPolicyOptions = {},
): Promise<Response> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const retryStatusCodes = options.retryStatusCodes ?? DEFAULT_RETRY_STATUS_CODES;
  const requestInit = options as RequestInit;

  let attempt = 0;
  while (attempt <= retryCount) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...requestInit,
        signal: controller.signal,
      });
      setConnectivityState(true, null);

      if (attempt < retryCount && retryStatusCodes.includes(response.status)) {
        const delayMs = retryDelayMs * 2 ** attempt;
        logWarn('http', `retrying request after status ${response.status}`, {
          input: String(input),
          attempt: attempt + 1,
          delayMs,
        });
        attempt += 1;
        await wait(delayMs);
        continue;
      }

      return response;
    } catch (error) {
      if (isAbortError(error)) {
        if (attempt < retryCount) {
          const delayMs = retryDelayMs * 2 ** attempt;
          logWarn('http', 'request timed out, retrying', {
            input: String(input),
            timeoutMs,
            attempt: attempt + 1,
            delayMs,
          });
          attempt += 1;
          await wait(delayMs);
          continue;
        }
        setConnectivityState(false, `Request timed out after ${timeoutMs}ms`);
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }

      if (attempt < retryCount) {
        const delayMs = retryDelayMs * 2 ** attempt;
        logWarn('http', 'request failed, retrying', {
          input: String(input),
          attempt: attempt + 1,
          delayMs,
        });
        attempt += 1;
        await wait(delayMs);
        continue;
      }
      const message = error instanceof Error ? error.message : 'Request failed';
      setConnectivityState(false, message);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  logDebug('http', 'request retry loop exited unexpectedly', { input: String(input) });
  throw new Error('Request failed after retry attempts');
};

export const requestJson = async <TResponse>(
  baseUrl: string,
  path: string,
  method: HttpMethod,
  payload?: unknown,
  options?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    retryCount?: number;
    retryDelayMs?: number;
    retryStatusCodes?: number[];
    credentials?: RequestCredentials;
  },
): Promise<TResponse> => {
  const authToken = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers ?? {}),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await requestWithPolicy(buildUrl(baseUrl, path), {
    method,
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
    credentials: options?.credentials ?? 'include',
    timeoutMs: options?.timeoutMs,
    retryCount: options?.retryCount,
    retryDelayMs: options?.retryDelayMs,
    retryStatusCodes: options?.retryStatusCodes,
  });
  const data = await parseJsonSafe<TResponse>(response);

  if (!response.ok) {
    throw new HttpError(response.status, normalizeErrorData(response.status, data));
  }

  return (data ?? {}) as TResponse;
};
