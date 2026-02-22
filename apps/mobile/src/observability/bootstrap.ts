import { logError, logWarn } from './logger';
import { reportCrash } from './crashReporter';

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
    void reportCrash('runtime_error', error, { fatal: Boolean(isFatal) });
    fallback?.(error, isFatal);
  });

  const globalScope = globalThis as unknown as {
    onunhandledrejection?: ((event: { reason?: unknown }) => void) | null;
  };
  const previousUnhandled = globalScope.onunhandledrejection;
  globalScope.onunhandledrejection = (event) => {
    logError('crash', 'Unhandled promise rejection', event?.reason);
    void reportCrash('unhandled_rejection', event?.reason ?? 'Unknown rejection', {
      fatal: false,
    });
    previousUnhandled?.(event);
  };
};
