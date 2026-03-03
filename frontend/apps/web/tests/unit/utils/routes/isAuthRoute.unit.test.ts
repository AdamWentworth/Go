import { describe, expect, it } from 'vitest';

import { isAuthRoute } from '@/utils/routes/isAuthRoute';

describe('isAuthRoute', () => {
  it('matches login and register routes', () => {
    expect(isAuthRoute('/login')).toBe(true);
    expect(isAuthRoute('/register')).toBe(true);
  });

  it('is case-insensitive and tolerates trailing slash', () => {
    expect(isAuthRoute('/LOGIN/')).toBe(true);
    expect(isAuthRoute('/Register/')).toBe(true);
  });

  it('returns false for non-auth routes', () => {
    expect(isAuthRoute('/pokemon')).toBe(false);
    expect(isAuthRoute('/account')).toBe(false);
  });
});
