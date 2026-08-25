export type NativeActionMenuPath = '/pokemon' | '/search' | '/trades';
export type ReadyNativePath = '/native/collection' | '/native/search' | '/native/trades';

export type NativeActionMenuDestination =
  | { kind: 'current' }
  | { kind: 'native'; pathname: ReadyNativePath }
  | { kind: 'web'; path: string };

const NATIVE_DESTINATIONS: Record<NativeActionMenuPath, NativeActionMenuDestination> = {
  '/pokemon': { kind: 'native', pathname: '/native/collection' },
  '/search': { kind: 'native', pathname: '/native/search' },
  '/trades': { kind: 'native', pathname: '/native/trades' },
};

const isNativeActionMenuPath = (path: string): path is NativeActionMenuPath => (
  path === '/pokemon' || path === '/search' || path === '/trades'
);

export const resolveNativeActionMenuDestination = (
  path: string,
  currentPath?: NativeActionMenuPath,
): NativeActionMenuDestination => {
  if (path === currentPath) return { kind: 'current' };
  if (isNativeActionMenuPath(path)) return NATIVE_DESTINATIONS[path];
  return { kind: 'web', path };
};

export const resolveNativeLoginReturnTo = (requestedPath?: string): ReadyNativePath | '/web' => (
  requestedPath === '/native/collection'
    || requestedPath === '/native/search'
    || requestedPath === '/native/trades'
    ? requestedPath
    : '/web'
);
