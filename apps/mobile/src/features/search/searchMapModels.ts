import type { SearchResultRow } from '@pokemongonexus/shared-contracts/search';

export type SearchMapPoint = {
  markerId: string;
  resultIndex: number;
  pokemonId: number | null;
  username: string | null;
  latitude: number;
  longitude: number;
  row: SearchResultRow;
};

export type SearchMapCoordinateBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export type SearchMapViewportState = {
  latRatio: number;
  lonRatio: number;
  zoom: number;
};

const CANDIDATE_LAT_KEYS = [
  'latitude',
  'lat',
  'trainer_latitude',
  'user_latitude',
] as const;
const CANDIDATE_LON_KEYS = [
  'longitude',
  'lon',
  'lng',
  'trainer_longitude',
  'user_longitude',
] as const;
const CANDIDATE_USERNAME_KEYS = ['username', 'trainer_username', 'user_name'] as const;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const readFromKeys = (row: SearchResultRow, keys: readonly string[]): number | null => {
  for (const key of keys) {
    const parsed = toFiniteNumber(row[key]);
    if (parsed !== null) return parsed;
  }
  return null;
};

const readNestedCoordinate = (
  row: SearchResultRow,
  key: 'latitude' | 'longitude',
): number | null => {
  const nested = row.location;
  if (!nested || typeof nested !== 'object') return null;
  const value =
    key === 'latitude'
      ? (nested as { latitude?: unknown; lat?: unknown }).latitude ??
        (nested as { latitude?: unknown; lat?: unknown }).lat
      : (nested as { longitude?: unknown; lon?: unknown; lng?: unknown }).longitude ??
        (nested as { longitude?: unknown; lon?: unknown; lng?: unknown }).lon ??
        (nested as { longitude?: unknown; lon?: unknown; lng?: unknown }).lng;
  return toFiniteNumber(value);
};

const toUsername = (row: SearchResultRow): string | null => {
  for (const key of CANDIDATE_USERNAME_KEYS) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
};

export const toSearchMapPoints = (rows: SearchResultRow[]): SearchMapPoint[] => {
  const points: SearchMapPoint[] = [];
  rows.forEach((row, resultIndex) => {
    const latitude =
      readFromKeys(row, CANDIDATE_LAT_KEYS) ?? readNestedCoordinate(row, 'latitude');
    const longitude =
      readFromKeys(row, CANDIDATE_LON_KEYS) ?? readNestedCoordinate(row, 'longitude');

    if (latitude === null || longitude === null) return;
    points.push({
      markerId: `marker-${resultIndex + 1}`,
      resultIndex,
      pokemonId: toFiniteNumber(row.pokemon_id),
      username: toUsername(row),
      latitude,
      longitude,
      row,
    });
  });
  return points;
};

export const DEFAULT_SEARCH_MAP_VIEWPORT: SearchMapViewportState = {
  latRatio: 0.5,
  lonRatio: 0.5,
  zoom: 1,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const resolveSpan = (range: number, zoom: number): number => {
  if (!Number.isFinite(range) || range <= 0) return 0;
  const safeZoom = clamp(zoom, 1, 16);
  return range / safeZoom;
};

const projectCenter = (min: number, max: number, ratio: number): number => {
  if (min === max) return min;
  const normalized = clamp(ratio, 0, 1);
  return min + (max - min) * normalized;
};

const fitToBounds = (
  min: number,
  max: number,
  center: number,
  span: number,
): { min: number; max: number } => {
  if (min === max || span <= 0 || span >= max - min) return { min, max };
  let nextMin = center - span / 2;
  let nextMax = center + span / 2;
  if (nextMin < min) {
    nextMin = min;
    nextMax = min + span;
  }
  if (nextMax > max) {
    nextMax = max;
    nextMin = max - span;
  }
  return { min: nextMin, max: nextMax };
};

export const getSearchMapBounds = (points: SearchMapPoint[]): SearchMapCoordinateBounds | null => {
  if (points.length === 0) return null;
  return points.reduce<SearchMapCoordinateBounds>(
    (acc, point) => ({
      minLat: Math.min(acc.minLat, point.latitude),
      maxLat: Math.max(acc.maxLat, point.latitude),
      minLon: Math.min(acc.minLon, point.longitude),
      maxLon: Math.max(acc.maxLon, point.longitude),
    }),
    {
      minLat: points[0].latitude,
      maxLat: points[0].latitude,
      minLon: points[0].longitude,
      maxLon: points[0].longitude,
    },
  );
};

export const getViewportBounds = (
  bounds: SearchMapCoordinateBounds | null,
  viewport: SearchMapViewportState,
): SearchMapCoordinateBounds | null => {
  if (!bounds) return null;

  const latRange = bounds.maxLat - bounds.minLat;
  const lonRange = bounds.maxLon - bounds.minLon;
  const latSpan = resolveSpan(latRange, viewport.zoom);
  const lonSpan = resolveSpan(lonRange, viewport.zoom);

  const latCenter = projectCenter(bounds.minLat, bounds.maxLat, viewport.latRatio);
  const lonCenter = projectCenter(bounds.minLon, bounds.maxLon, viewport.lonRatio);
  const latWindow = fitToBounds(bounds.minLat, bounds.maxLat, latCenter, latSpan);
  const lonWindow = fitToBounds(bounds.minLon, bounds.maxLon, lonCenter, lonSpan);

  return {
    minLat: latWindow.min,
    maxLat: latWindow.max,
    minLon: lonWindow.min,
    maxLon: lonWindow.max,
  };
};

export const isPointInViewport = (
  point: SearchMapPoint,
  viewportBounds: SearchMapCoordinateBounds | null,
): boolean => {
  if (!viewportBounds) return true;
  return (
    point.latitude >= viewportBounds.minLat &&
    point.latitude <= viewportBounds.maxLat &&
    point.longitude >= viewportBounds.minLon &&
    point.longitude <= viewportBounds.maxLon
  );
};

export type SearchMapMarkerLayout = {
  markerId: string;
  left: number;
  top: number;
};

const normalizeValue = (value: number, min: number, max: number): number => {
  if (min === max) return 0.5;
  return (value - min) / (max - min);
};

export const buildSearchMapMarkerLayout = (
  points: SearchMapPoint[],
  width: number,
  height: number,
  padding = 12,
): SearchMapMarkerLayout[] => {
  const bounds = getSearchMapBounds(points);
  if (!bounds) return [];
  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);

  return points.map((point) => {
    const x = normalizeValue(point.longitude, bounds.minLon, bounds.maxLon);
    const y = normalizeValue(point.latitude, bounds.minLat, bounds.maxLat);
    return {
      markerId: point.markerId,
      left: padding + x * innerWidth,
      top: padding + (1 - y) * innerHeight,
    };
  });
};
