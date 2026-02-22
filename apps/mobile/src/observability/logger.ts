const asString = (message: unknown): string =>
  typeof message === 'string' ? message : JSON.stringify(message);

export const logDebug = (scope: string, message: unknown, meta?: unknown): void => {
  if (!__DEV__) return;
  if (meta === undefined) {
    console.debug(`[mobile:${scope}]`, asString(message));
    return;
  }
  console.debug(`[mobile:${scope}]`, asString(message), meta);
};

export const logWarn = (scope: string, message: unknown, meta?: unknown): void => {
  if (meta === undefined) {
    console.warn(`[mobile:${scope}]`, asString(message));
    return;
  }
  console.warn(`[mobile:${scope}]`, asString(message), meta);
};

export const logError = (scope: string, message: unknown, meta?: unknown): void => {
  if (meta === undefined) {
    console.error(`[mobile:${scope}]`, asString(message));
    return;
  }
  console.error(`[mobile:${scope}]`, asString(message), meta);
};
