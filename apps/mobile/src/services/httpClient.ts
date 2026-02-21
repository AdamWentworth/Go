import { buildUrl } from '@pokemongonexus/shared-contracts/common';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

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

const normalizeErrorData = (status: number, payload: unknown): HttpErrorData => {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return payload as HttpErrorData;
    }
  }
  return { message: `Request failed with status ${status}` };
};

export const parseJsonSafe = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const requestJson = async <TResponse>(
  baseUrl: string,
  path: string,
  method: HttpMethod,
  payload?: Record<string, unknown>,
): Promise<TResponse> => {
  const response = await fetch(buildUrl(baseUrl, path), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const data = await parseJsonSafe<TResponse>(response);

  if (!response.ok) {
    throw new HttpError(response.status, normalizeErrorData(response.status, data));
  }

  return (data ?? {}) as TResponse;
};
