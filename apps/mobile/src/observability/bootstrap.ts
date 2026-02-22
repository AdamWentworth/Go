import { logError, logWarn } from './logger';

let initialized = false;

type ErrorUtilsLike = {
  getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
};

const getErrorUtils = (): ErrorUtilsLike | null => {
  const maybe = (globalThis as unknown as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  return maybe ?? null;
};

export const initializeObservability = (): void => {
  if (initialized) return;
  initialized = true;

  const errorUtils = getErrorUtils();
  if (!errorUtils?.setGlobalHandler) {
    logWarn('observability', 'Global error handler unavailable in current runtime');
    return;
  }

  const fallback = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    logError('crash', isFatal ? 'Fatal runtime error' : 'Unhandled runtime error', error);
    fallback?.(error, isFatal);
  });
};
