type NativeRouteSurface = {
  dark: string;
  light: string;
};

const DEFAULT_SURFACE: NativeRouteSurface = { dark: '#101a19', light: '#f8fff9' };

// The native Stack owns the physical status- and navigation-bar regions while
// each route owns its inset content. Matching both surfaces prevents a route
// from looking like a shorter rectangle floating between two system bands.
const ROUTE_SURFACES: Record<string, NativeRouteSurface> = {
  index: { dark: '#071012', light: '#f8fff9' },
  login: { dark: '#0f0f0f', light: '#f8fff9' },
  register: { dark: '#07111e', light: '#f8fff9' },
  'reset-password': { dark: '#0f0f0f', light: '#f8fff9' },
  'verify-email-change': { dark: '#06162f', light: '#f8fff9' },
  'not-found': { dark: '#06131d', light: '#f8fff9' },
  'info/[slug]': { dark: '#090d12', light: '#f8fff9' },
  'pokedex/index': { dark: '#090d12', light: '#f8fff9' },
  'pokedex/[variantId]': { dark: '#090d12', light: '#f8fff9' },
  rankings: { dark: '#0c1112', light: '#f5f2e9' },
  raid: { dark: '#071011', light: '#f8fff9' },
  'raid-methodology': { dark: '#0b1012', light: '#f8fff9' },
  max: { dark: '#090d0d', light: '#f8fff9' },
  pvp: { dark: '#0d1112', light: '#f8fff9' },
  'pvp-methodology': { dark: '#0b1012', light: '#f8fff9' },
  collection: { dark: '#111111', light: '#f8fff9' },
  'collection/[instanceId]': { dark: '#0f2b2b', light: '#f8fff9' },
  'collection/catalog/[variantId]': { dark: '#07110f', light: '#f8fff9' },
  'collection/trainer/[username]/index': { dark: '#111111', light: '#f8fff9' },
  'collection/trainer/[username]/[instanceId]': { dark: '#0f2b2b', light: '#f8fff9' },
  search: { dark: '#080d0f', light: '#f8fff9' },
  trades: { dark: '#071012', light: '#f8fff9' },
  'trade-board': { dark: '#071014', light: '#f8fff9' },
  'trade-board/[username]': { dark: '#071014', light: '#f8fff9' },
  settings: { dark: '#081012', light: '#f8fff9' },
  account: { dark: '#081012', light: '#f8fff9' },
  friends: { dark: '#080d0f', light: '#f8fff9' },
  'profile/index': { dark: '#081012', light: '#f8fff9' },
  'profile/[username]': { dark: '#081012', light: '#f8fff9' },
};

export const nativeRouteSurface = (routeName: string, light: boolean): string => {
  const surface = ROUTE_SURFACES[routeName] ?? DEFAULT_SURFACE;
  return light ? surface.light : surface.dark;
};
