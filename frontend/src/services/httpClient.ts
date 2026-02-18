import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('httpClient');
const DEFAULT_TIMEOUT_MS = 10000;

export type RequestWithPolicyOptions = Omit<RequestInit, 'signal' | 'credentials'> & {
  credentials?: RequestCredentials;
  timeoutMs?: number;
};

export async function requestWithPolicy(
  input: string | URL,
  options: RequestWithPolicyOptions = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      credentials: options.credentials ?? 'include',
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      log.warn('request timed out', { input: String(input), timeoutMs });
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

type ApiErrorBody = {
  message: string;
  [key: string]: unknown;
};

type ApiErrorResponse = {
  status: number;
  data: ApiErrorBody;
};

export class HttpError extends Error {
  response: ApiErrorResponse;

  constructor(message: string, status: number, data: ApiErrorBody) {
    super(message);
    this.name = 'HttpError';
    this.response = {
      status,
      data,
    };
  }
}

function normalizeErrorBody(status: number, data: unknown): ApiErrorBody {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim() !== '') {
      return data as ApiErrorBody;
    }
  }

  return {
    message: `Request failed with status ${status}`,
  };
}

export function toHttpError(
  status: number,
  data: unknown,
  fallbackMessage?: string,
): HttpError {
  const normalizedBody = normalizeErrorBody(status, data);
  const message = fallbackMessage || normalizedBody.message;
  return new HttpError(message, status, normalizedBody);
}

export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(normalizedPath, normalizedBase);
  if (!query) return url.toString();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}
