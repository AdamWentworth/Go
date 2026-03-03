import { mapAuthErrorMessage } from '../../../../src/features/auth/serverErrorMessages';

const httpLikeError = (status: number, message: string) => ({
  status,
  data: { message },
});

describe('serverErrorMessages', () => {
  it('maps register conflict cases', () => {
    expect(
      mapAuthErrorMessage(httpLikeError(409, 'username already exists'), 'register'),
    ).toBe('Username is already taken.');
    expect(
      mapAuthErrorMessage(httpLikeError(409, 'email already exists'), 'register'),
    ).toBe('Email is already registered.');
    expect(
      mapAuthErrorMessage(httpLikeError(409, 'trainer code exists'), 'register'),
    ).toBe('Trainer code is already registered.');
  });

  it('maps account update authorization and lookup cases', () => {
    expect(
      mapAuthErrorMessage(httpLikeError(401, 'unauthorized'), 'account_update'),
    ).toBe('Your session expired. Please sign in again.');
    expect(
      mapAuthErrorMessage(httpLikeError(403, 'forbidden'), 'account_update'),
    ).toBe('You are not allowed to update this account.');
    expect(
      mapAuthErrorMessage(httpLikeError(404, 'missing'), 'account_update'),
    ).toBe('Account was not found.');
  });

  it('falls back safely for unknown errors', () => {
    expect(mapAuthErrorMessage(new Error('boom'), 'register')).toBe('boom');
    expect(mapAuthErrorMessage({ any: 'value' }, 'account_delete')).toBe('Failed to delete account.');
  });
});
