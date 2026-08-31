import { nativeRouteSurface } from '../../../src/navigation/nativeRouteSurface';

describe('nativeRouteSurface', () => {
  it('matches the physical system regions to each dark route surface', () => {
    expect(nativeRouteSurface('collection', false)).toBe('#111111');
    expect(nativeRouteSurface('trades', false)).toBe('#071012');
    expect(nativeRouteSurface('pokedex/index', false)).toBe('#090d12');
    expect(nativeRouteSurface('collection/[instanceId]', false)).toBe('#0f2b2b');
  });

  it('preserves route-specific light surfaces', () => {
    expect(nativeRouteSurface('rankings', true)).toBe('#f5f2e9');
    expect(nativeRouteSurface('collection', true)).toBe('#f8fff9');
  });

  it('uses a non-black full-window fallback for future routes', () => {
    expect(nativeRouteSurface('future-route', false)).toBe('#101a19');
  });
});
