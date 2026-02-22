import type { SearchResultRow } from '@pokemongonexus/shared-contracts/search';
import {
  buildSearchMapMarkerLayout,
  getSearchMapBounds,
  getViewportBounds,
  isPointInViewport,
  toSearchMapPoints,
  type SearchMapPoint,
} from '../../../../src/features/search/searchMapModels';

const makePoint = (
  markerId: string,
  latitude: number,
  longitude: number,
): SearchMapPoint => ({
  markerId,
  resultIndex: Number(markerId.replace('marker-', '')) - 1,
  pokemonId: 1,
  username: 'test',
  latitude,
  longitude,
  row: { pokemon_id: 1, latitude, longitude },
});

describe('searchMapModels', () => {
  it('builds map points from flat and nested coordinates', () => {
    const rows: SearchResultRow[] = [
      { pokemon_id: 1, username: ' ash ', latitude: 10, longitude: -20 },
      { pokemon_id: 2, trainer_username: 'misty', location: { lat: '11.5', lon: '-21.5' } },
      { pokemon_id: 3, latitude: 'x', longitude: 15 },
      { pokemon_id: 4, user_name: 'brock', lat: 12.2, lng: 33.1 },
    ];

    const points = toSearchMapPoints(rows);
    expect(points).toHaveLength(3);
    expect(points.map((point) => point.markerId)).toEqual(['marker-1', 'marker-2', 'marker-4']);
    expect(points[0]).toEqual(
      expect.objectContaining({
        pokemonId: 1,
        username: 'ash',
        latitude: 10,
        longitude: -20,
      }),
    );
    expect(points[1]).toEqual(
      expect.objectContaining({
        pokemonId: 2,
        username: 'misty',
        latitude: 11.5,
        longitude: -21.5,
      }),
    );
  });

  it('computes bounds and marker layout', () => {
    const points = toSearchMapPoints([
      { pokemon_id: 1, latitude: 10, longitude: 20 },
      { pokemon_id: 2, latitude: 20, longitude: 40 },
    ]);

    const bounds = getSearchMapBounds(points);
    expect(bounds).toEqual({ minLat: 10, maxLat: 20, minLon: 20, maxLon: 40 });

    const layout = buildSearchMapMarkerLayout(points, 200, 100, 10);
    expect(layout).toHaveLength(2);
    expect(layout[0]).toEqual(expect.objectContaining({ markerId: 'marker-1' }));
    expect(layout[1]).toEqual(expect.objectContaining({ markerId: 'marker-2' }));
    expect(layout[0].left).toBeLessThan(layout[1].left);
    expect(layout[0].top).toBeGreaterThan(layout[1].top);
  });

  it('centers markers when all points share same coordinates', () => {
    const points = toSearchMapPoints([
      { pokemon_id: 7, latitude: 50, longitude: 50 },
      { pokemon_id: 8, latitude: 50, longitude: 50 },
    ]);

    const layout = buildSearchMapMarkerLayout(points, 300, 200, 20);
    expect(layout).toHaveLength(2);
    expect(layout[0].left).toBeCloseTo(150, 6);
    expect(layout[0].top).toBeCloseTo(100, 6);
    expect(layout[1].left).toBeCloseTo(150, 6);
    expect(layout[1].top).toBeCloseTo(100, 6);
  });

  describe('getViewportBounds', () => {
    const bounds = { minLat: 0, maxLat: 10, minLon: 0, maxLon: 10 };

    it('returns null when bounds is null', () => {
      expect(getViewportBounds(null, { latRatio: 0.5, lonRatio: 0.5, zoom: 1 })).toBeNull();
    });

    it('returns full bounds at zoom 1 (no clipping)', () => {
      const result = getViewportBounds(bounds, { latRatio: 0.5, lonRatio: 0.5, zoom: 1 });
      expect(result).toEqual(bounds);
    });

    it('returns a narrower window at zoom 2', () => {
      const result = getViewportBounds(bounds, { latRatio: 0.5, lonRatio: 0.5, zoom: 2 });
      expect(result).not.toBeNull();
      const latSpread = result!.maxLat - result!.minLat;
      const lonSpread = result!.maxLon - result!.minLon;
      expect(latSpread).toBeLessThan(10);
      expect(lonSpread).toBeLessThan(10);
    });

    it('clamps viewport window to bounds edges when panned to corner', () => {
      const result = getViewportBounds(bounds, { latRatio: 0, lonRatio: 0, zoom: 4 });
      expect(result).not.toBeNull();
      expect(result!.minLat).toBeGreaterThanOrEqual(bounds.minLat);
      expect(result!.minLon).toBeGreaterThanOrEqual(bounds.minLon);
    });
  });

  describe('isPointInViewport', () => {
    it('returns true for any point when viewportBounds is null', () => {
      const point = makePoint('marker-1', 5, 5);
      expect(isPointInViewport(point, null)).toBe(true);
    });

    it('returns true when point is inside viewport', () => {
      const point = makePoint('marker-1', 5, 5);
      const viewport = { minLat: 0, maxLat: 10, minLon: 0, maxLon: 10 };
      expect(isPointInViewport(point, viewport)).toBe(true);
    });

    it('returns true for points exactly on viewport boundary', () => {
      const point = makePoint('marker-1', 0, 0);
      const viewport = { minLat: 0, maxLat: 10, minLon: 0, maxLon: 10 };
      expect(isPointInViewport(point, viewport)).toBe(true);
    });

    it('returns false when point latitude is outside viewport', () => {
      const point = makePoint('marker-1', 15, 5);
      const viewport = { minLat: 0, maxLat: 10, minLon: 0, maxLon: 10 };
      expect(isPointInViewport(point, viewport)).toBe(false);
    });

    it('returns false when point longitude is outside viewport', () => {
      const point = makePoint('marker-1', 5, 20);
      const viewport = { minLat: 0, maxLat: 10, minLon: 0, maxLon: 10 };
      expect(isPointInViewport(point, viewport)).toBe(false);
    });

    it('filters a mixed point set correctly', () => {
      const inside = makePoint('marker-1', 5, 5);
      const outside = makePoint('marker-2', 50, 50);
      const viewport = { minLat: 0, maxLat: 10, minLon: 0, maxLon: 10 };
      const filtered = [inside, outside].filter((p) => isPointInViewport(p, viewport));
      expect(filtered).toHaveLength(1);
      expect(filtered[0].markerId).toBe('marker-1');
    });
  });
});
