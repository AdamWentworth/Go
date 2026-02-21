let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = typeof token === 'string' && token.trim().length > 0 ? token : null;
};

export const getAuthToken = (): string | null => authToken;

export const clearAuthToken = (): void => {
  authToken = null;
};

