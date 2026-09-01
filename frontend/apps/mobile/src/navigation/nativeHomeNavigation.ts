import type { PokemonTagOrderKey } from '@pokemongonexus/shared-contracts/users';
import { nativeCollectionTagKeyForFilter } from '../features/collection/nativeCollectionRouteFilter';
import { resolveNativeDeepLink } from './nativeDeepLink';

export const NATIVE_HOME_NAVIGATION_SOURCE = 'home-navigation';

type RunWithLoading = (source: string, action: () => void) => void;
type ScheduleFrame = (callback: () => void) => number;

export type NativeHomeCollectionEntry = {
  destination: string;
  selectedTagKey: PokemonTagOrderKey | null;
};

/**
 * Home summary cards enter through the same parameter-free route as the
 * action-menu Pokémon button. The caller primes selectedTagKey in the native
 * collection session before pushing destination. Instance links keep their
 * direct detail destination and do not alter the saved collection context.
 */
export const resolveNativeHomeCollectionEntry = (
  path: string,
): NativeHomeCollectionEntry => {
  const [, search = ''] = path.split('?');
  const params = new URLSearchParams(search);

  if (params.get('instanceId')?.trim()) {
    return {
      destination: resolveNativeDeepLink(path),
      selectedTagKey: null,
    };
  }

  return {
    destination: '/native/collection',
    selectedTagKey: nativeCollectionTagKeyForFilter(params.get('filter')),
  };
};

/**
 * Paint the root loader before asking Expo Router to render a potentially
 * expensive destination. Two frame boundaries guarantee one composited frame
 * with the loader, matching the action-menu navigation handoff.
 */
export const runNativeHomeNavigationWithLoading = (
  runWithLoading: RunWithLoading,
  navigate: () => void,
  scheduleFrame: ScheduleFrame = requestAnimationFrame,
): void => {
  runWithLoading(NATIVE_HOME_NAVIGATION_SOURCE, () => {
    scheduleFrame(() => scheduleFrame(navigate));
  });
};
