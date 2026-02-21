type ErrorContext = 'register' | 'account_update' | 'account_delete';

const fallbackByContext: Record<ErrorContext, string> = {
  register: 'Failed to register account.',
  account_update: 'Failed to update account.',
  account_delete: 'Failed to delete account.',
};

const normalizeMessage = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
};

const isHttpLikeError = (
  error: unknown,
): error is { status: number; data?: { message?: unknown } } =>
  Boolean(
    error &&
      typeof error === 'object' &&
      typeof (error as { status?: unknown }).status === 'number',
  );

export const mapAuthErrorMessage = (error: unknown, context: ErrorContext): string => {
  if (!isHttpLikeError(error)) {
    if (error instanceof Error && error.message.trim().length > 0) return error.message;
    return fallbackByContext[context];
  }

  const status = error.status;
  const rawMessage = typeof error.data?.message === 'string' ? error.data.message : '';
  const message = normalizeMessage(rawMessage);

  if (context === 'register') {
    if (status === 409) {
      if (message.includes('username')) return 'Username is already taken.';
      if (message.includes('email')) return 'Email is already registered.';
      if (message.includes('trainer')) return 'Trainer code is already registered.';
      return 'Account already exists with provided details.';
    }
    if (status === 400) return 'Please check your registration fields and try again.';
  }

  if (context === 'account_update') {
    if (status === 401) return 'Your session expired. Please sign in again.';
    if (status === 403) return 'You are not allowed to update this account.';
    if (status === 404) return 'Account was not found.';
    if (status === 400) return 'Invalid account update payload.';
  }

  if (context === 'account_delete') {
    if (status === 401) return 'Your session expired. Please sign in again.';
    if (status === 403) return 'You are not allowed to delete this account.';
    if (status === 404) return 'Account was not found.';
  }

  if (status >= 500) return 'Server error. Please try again later.';
  if (rawMessage.trim().length > 0) return rawMessage;
  return fallbackByContext[context];
};
