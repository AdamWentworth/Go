export type NativeActionMenuPath = '/' | '/pokemon' | '/profile' | '/profile/friends' | '/search' | '/settings' | '/trade-board' | '/trades';
export type ReadyNativePath = '/native' | '/native/account' | '/native/collection' | '/native/friends' | '/native/profile' | '/native/search' | '/native/settings' | '/native/trade-board' | '/native/trades';
export type NativeLoginReturnPath = ReadyNativePath | `/native/profile/${string}`;

export type NativeActionMenuDestination =
  | { kind: 'current' }
  | { kind: 'native'; pathname: ReadyNativePath }
  | { kind: 'web'; path: string };

const NATIVE_DESTINATIONS: Record<NativeActionMenuPath, NativeActionMenuDestination> = {
  '/': { kind: 'native', pathname: '/native' },
  '/pokemon': { kind: 'native', pathname: '/native/collection' },
  '/profile': { kind: 'native', pathname: '/native/profile' },
  '/profile/friends': { kind: 'native', pathname: '/native/friends' },
  '/search': { kind: 'native', pathname: '/native/search' },
  '/settings': { kind: 'native', pathname: '/native/settings' },
  '/trade-board': { kind: 'native', pathname: '/native/trade-board' },
  '/trades': { kind: 'native', pathname: '/native/trades' },
};

const isNativeActionMenuPath = (path: string): path is NativeActionMenuPath => (
  path === '/' || path === '/pokemon' || path === '/profile' || path === '/profile/friends' || path === '/search' || path === '/settings' || path === '/trade-board' || path === '/trades'
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
