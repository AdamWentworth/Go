import {
  NATIVE_HOME_NAVIGATION_SOURCE,
  resolveNativeHomeCollectionEntry,
  runNativeHomeNavigationWithLoading,
} from '../../../src/navigation/nativeHomeNavigation';

describe('resolveNativeHomeCollectionEntry', () => {
  it.each([
    ['/pokemon?filter=caught', 'system:caught'],
    ['/pokemon?filter=favorites', 'system:favorites'],
    ['/pokemon?filter=trade', 'system:trade'],
    ['/pokemon?filter=wanted', 'system:wanted'],
  ] as const)(
    'primes %s and enters through the working parameter-free collection route',
    (path, selectedTagKey) => {
      expect(resolveNativeHomeCollectionEntry(path)).toEqual({
        destination: '/native/collection',
        selectedTagKey,
      });
    },
  );

  it('leaves the saved collection context alone for the unfiltered collection link', () => {
    expect(resolveNativeHomeCollectionEntry('/pokemon')).toEqual({
      destination: '/native/collection',
      selectedTagKey: null,
    });
  });

  it('keeps recent-Pokémon links on their direct instance route', () => {
    expect(resolveNativeHomeCollectionEntry(
      '/pokemon?filter=caught&instanceId=owned%3A1',
    )).toEqual({
      destination: '/native/collection/owned%3A1',
      selectedTagKey: null,
    });
  });
});

describe('runNativeHomeNavigationWithLoading', () => {
  it('paints the shared loader for a full frame before starting navigation', () => {
    const frames: Array<() => void> = [];
    const navigate = jest.fn();
    const scheduleFrame = jest.fn((callback: () => void) => {
      frames.push(callback);
      return frames.length;
    });
    const runWithLoading = jest.fn((_source: string, action: () => void) => action());

    runNativeHomeNavigationWithLoading(runWithLoading, navigate, scheduleFrame);

    expect(runWithLoading).toHaveBeenCalledWith(
      NATIVE_HOME_NAVIGATION_SOURCE,
      expect.any(Function),
    );
    expect(navigate).not.toHaveBeenCalled();
    frames.shift()?.();
    expect(navigate).not.toHaveBeenCalled();
    frames.shift()?.();
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
