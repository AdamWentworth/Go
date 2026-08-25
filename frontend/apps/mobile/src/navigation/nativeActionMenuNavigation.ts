export type NativeActionMenuPath = '/pokemon' | '/profile/friends' | '/search' | '/settings' | '/trades';
export type ReadyNativePath = '/native/account' | '/native/collection' | '/native/friends' | '/native/search' | '/native/settings' | '/native/trades';
export type NativeLoginReturnPath = ReadyNativePath | '/native/profile' | `/native/profile/${string}`;

export type NativeActionMenuDestination =
  | { kind: 'current' }
  | { kind: 'native'; pathname: ReadyNativePath }
  | { kind: 'web'; path: string };

const NATIVE_DESTINATIONS: Record<NativeActionMenuPath, NativeActionMenuDestination> = {
  '/pokemon': { kind: 'native', pathname: '/native/collection' },
  '/profile/friends': { kind: 'native', pathname: '/native/friends' },
  '/search': { kind: 'native', pathname: '/native/search' },
  '/settings': { kind: 'native', pathname: '/native/settings' },
  '/trades': { kind: 'native', pathname: '/native/trades' },
};

const isNativeActionMenuPath = (path: string): path is NativeActionMenuPath => (
  path === '/pokemon' || path === '/profile/friends' || path === '/search' || path === '/settings' || path === '/trades'
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
    || requestedPath === '/native/collection'
    || requestedPath === '/native/friends'
    || requestedPath === '/native/search'
    || requestedPath === '/native/settings'
    || requestedPath === '/native/trades'
    || requestedPath === '/native/profile') {
    return requestedPath;
  }
  if (requestedPath && /^\/native\/profile\/[^/]+$/.test(requestedPath)) {
    return requestedPath as `/native/profile/${string}`;
  }
  return '/web';
};
