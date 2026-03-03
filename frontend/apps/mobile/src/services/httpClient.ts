import { logDebug, logWarn } from '../observability/logger';

export type RequestWithPolicyOptions = Omit<RequestInit, 'signal'> & {
  timeoutMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
  retryStatusCodes?: number[];
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

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  logDebug('http', 'request retry loop exited unexpectedly', { input: String(input) });
  throw new Error('Request failed after retry attempts');
};
