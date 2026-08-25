import {
  resolveNativeActionMenuDestination,
  resolveNativeLoginReturnTo,
} from '../../../src/navigation/nativeActionMenuNavigation';

describe('resolveNativeActionMenuDestination', () => {
  test.each([
    ['/pokemon', '/native/collection'],
    ['/profile', '/native/profile'],
    ['/profile/friends', '/native/friends'],
    ['/search', '/native/search'],
    ['/settings', '/native/settings'],
    ['/trades', '/native/trades'],
  ] as const)('keeps %s inside the ready native experience', (path, pathname) => {
    expect(resolveNativeActionMenuDestination(path)).toEqual({ kind: 'native', pathname });
  });

  test('does not reopen the route that is already visible', () => {
    expect(resolveNativeActionMenuDestination('/search', '/search')).toEqual({ kind: 'current' });
  });

  test('keeps unmigrated destinations in the canonical web app', () => {
    expect(resolveNativeActionMenuDestination('/raid')).toEqual({
      kind: 'web',
      path: '/raid',
    });
  });

  test.each([
    '/native/account',
    '/native/collection',
    '/native/friends',
    '/native/search',
    '/native/settings',
    '/native/trades',
    '/native/profile',
    '/native/profile/OtherTrainer',
  ] as const)('returns a signed-in user to ready native route %s', (path) => {
    expect(resolveNativeLoginReturnTo(path)).toBe(path);
  });

  test('rejects arbitrary login return paths', () => {
    expect(resolveNativeLoginReturnTo('/native/not-ready')).toBe('/web');
    expect(resolveNativeLoginReturnTo('/native/profile/name/extra')).toBe('/web');
    expect(resolveNativeLoginReturnTo()).toBe('/web');
  });
});
