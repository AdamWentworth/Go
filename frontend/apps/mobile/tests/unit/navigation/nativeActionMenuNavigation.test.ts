import {
  resolveNativeActionMenuDestination,
  resolveNativeLoginReturnTo,
} from '../../../src/navigation/nativeActionMenuNavigation';

describe('resolveNativeActionMenuDestination', () => {
  test.each([
    ['/', '/native'],
    ['/pokemon', '/native/collection'],
    ['/pokedex', '/native/pokedex'],
    ['/profile', '/native/profile'],
    ['/profile/friends', '/native/friends'],
    ['/raid', '/native/raid'],
    ['/rankings', '/native/rankings'],
    ['/search', '/native/search'],
    ['/settings', '/native/settings'],
    ['/trade-board', '/native/trade-board'],
    ['/trades', '/native/trades'],
    ['/getting-started', '/native/info/getting-started'],
    ['/faq', '/native/info/faq'],
    ['/about', '/native/info/about'],
    ['/safety', '/native/info/safety'],
    ['/help', '/native/info/help'],
    ['/privacy', '/native/info/privacy'],
    ['/terms', '/native/info/terms'],
    ['/data-deletion', '/native/info/data-deletion'],
  ] as const)('keeps %s inside the ready native experience', (path, pathname) => {
    expect(resolveNativeActionMenuDestination(path)).toEqual({ kind: 'native', pathname });
  });

  test('does not reopen the route that is already visible', () => {
    expect(resolveNativeActionMenuDestination('/search', '/search')).toEqual({ kind: 'current' });
  });

  test('keeps unmigrated destinations in the canonical web app', () => {
    expect(resolveNativeActionMenuDestination('/max')).toEqual({
      kind: 'web',
      path: '/max',
    });
  });

  test.each([
    '/native',
    '/native/account',
    '/native/collection',
    '/native/friends',
    '/native/info/about',
    '/native/info/data-deletion',
    '/native/info/faq',
    '/native/info/getting-started',
    '/native/info/help',
    '/native/info/privacy',
    '/native/info/safety',
    '/native/info/terms',
    '/native/pokedex',
    '/native/raid',
    '/native/raid-methodology',
    '/native/rankings',
    '/native/search',
    '/native/settings',
    '/native/trade-board',
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
