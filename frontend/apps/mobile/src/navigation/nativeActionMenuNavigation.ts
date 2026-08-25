export type NativeActionMenuPath = '/' | '/about' | '/data-deletion' | '/faq' | '/getting-started' | '/help' | '/pokedex' | '/pokemon' | '/privacy' | '/profile' | '/profile/friends' | '/safety' | '/search' | '/settings' | '/terms' | '/trade-board' | '/trades';
export type ReadyNativePath = '/native' | '/native/account' | '/native/collection' | '/native/friends' | '/native/info/about' | '/native/info/data-deletion' | '/native/info/faq' | '/native/info/getting-started' | '/native/info/help' | '/native/info/privacy' | '/native/info/safety' | '/native/info/terms' | '/native/pokedex' | '/native/profile' | '/native/search' | '/native/settings' | '/native/trade-board' | '/native/trades';
export type NativeLoginReturnPath = ReadyNativePath | `/native/profile/${string}`;

export type NativeActionMenuDestination =
  | { kind: 'current' }
  | { kind: 'native'; pathname: ReadyNativePath }
  | { kind: 'web'; path: string };

const NATIVE_DESTINATIONS: Record<NativeActionMenuPath, NativeActionMenuDestination> = {
  '/': { kind: 'native', pathname: '/native' },
  '/about': { kind: 'native', pathname: '/native/info/about' },
  '/data-deletion': { kind: 'native', pathname: '/native/info/data-deletion' },
  '/faq': { kind: 'native', pathname: '/native/info/faq' },
  '/getting-started': { kind: 'native', pathname: '/native/info/getting-started' },
  '/help': { kind: 'native', pathname: '/native/info/help' },
  '/pokedex': { kind: 'native', pathname: '/native/pokedex' },
  '/pokemon': { kind: 'native', pathname: '/native/collection' },
  '/privacy': { kind: 'native', pathname: '/native/info/privacy' },
  '/profile': { kind: 'native', pathname: '/native/profile' },
  '/profile/friends': { kind: 'native', pathname: '/native/friends' },
  '/safety': { kind: 'native', pathname: '/native/info/safety' },
  '/search': { kind: 'native', pathname: '/native/search' },
  '/settings': { kind: 'native', pathname: '/native/settings' },
  '/terms': { kind: 'native', pathname: '/native/info/terms' },
  '/trade-board': { kind: 'native', pathname: '/native/trade-board' },
  '/trades': { kind: 'native', pathname: '/native/trades' },
};

const isNativeActionMenuPath = (path: string): path is NativeActionMenuPath => (
  Object.prototype.hasOwnProperty.call(NATIVE_DESTINATIONS, path)
);

export const resolveNativeActionMenuDestination = (
  path: string,
  currentPath?: string,
): NativeActionMenuDestination => {
  if (path === currentPath) return { kind: 'current' };
  if (isNativeActionMenuPath(path)) return NATIVE_DESTINATIONS[path];
  return { kind: 'web', path };
};

export const resolveNativeLoginReturnTo = (
  requestedPath?: string,
): NativeLoginReturnPath | '/web' => {
  if (requestedPath === '/native/account'
    || requestedPath === '/native'
    || requestedPath === '/native/collection'
    || requestedPath === '/native/friends'
    || requestedPath === '/native/info/about'
    || requestedPath === '/native/info/data-deletion'
    || requestedPath === '/native/info/faq'
    || requestedPath === '/native/info/getting-started'
    || requestedPath === '/native/info/help'
    || requestedPath === '/native/info/privacy'
    || requestedPath === '/native/info/safety'
    || requestedPath === '/native/info/terms'
    || requestedPath === '/native/pokedex'
    || requestedPath === '/native/search'
    || requestedPath === '/native/settings'
    || requestedPath === '/native/trade-board'
    || requestedPath === '/native/trades'
    || requestedPath === '/native/profile') {
    return requestedPath;
  }
  if (requestedPath && /^\/native\/profile\/[^/]+$/.test(requestedPath)) {
    return requestedPath as `/native/profile/${string}`;
  }
  return '/web';
};
