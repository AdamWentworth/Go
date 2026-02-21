import type { SearchResultRow } from '@pokemongonexus/shared-contracts/search';
import {
  buildSearchMapMarkerLayout,
  getSearchMapBounds,
  toSearchMapPoints,
} from '../../../../src/features/search/searchMapModels';

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
});
