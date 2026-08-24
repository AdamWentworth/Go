import {
  clearNativeInstanceNavigationContext,
  getNativeInstanceNavigationContext,
  resolveNativeInstanceNeighbors,
  setNativeInstanceNavigationContext,
} from '../../../../src/features/collection/nativeInstanceNavigationContext';

describe('native instance navigation context', () => {
  afterEach(clearNativeInstanceNavigationContext);

  it('preserves the filtered and sorted grid order for overlay navigation', () => {
    setNativeInstanceNavigationContext(['third', 'second', 'second', 'first']);

    expect(getNativeInstanceNavigationContext()).toEqual({
      orderedInstanceIds: ['third', 'second', 'first'],
    });
    expect(resolveNativeInstanceNeighbors({
      instanceId: 'second',
      fallbackIds: ['first', 'second', 'third'],
    })).toEqual({ previousId: 'third', nextId: 'first' });
  });

  it('uses the full collection only for direct links outside the saved context', () => {
    setNativeInstanceNavigationContext(['favorite-1']);

    expect(resolveNativeInstanceNeighbors({
      instanceId: 'second',
      fallbackIds: ['first', 'second', 'third'],
    })).toEqual({ previousId: 'first', nextId: 'third' });
  });
});
