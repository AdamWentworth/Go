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

