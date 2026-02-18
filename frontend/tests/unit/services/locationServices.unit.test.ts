import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchLocationOptions } from '@/services/locationServices';

describe('locationServices.fetchLocationOptions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes reverse-geocode records into displayName values', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        locations: [
          { name: 'Pallet Town', state_or_province: 'Kanto', country: 'Japan' },
          { city: 'Saffron City', state_or_province: 'Kanto', country: 'Japan' },
          { country: 'Japan' },
        ],
      }),
    } as Response);

    const result = await fetchLocationOptions(35.6895, 139.6917);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/reverse?lat=35.6895&lon=139.6917'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
      }),
    );
    expect(result).toHaveLength(3);
    expect(result[0].displayName).toBe('Pallet Town, Kanto, Japan');
    expect(result[1].displayName).toBe('Saffron City, Kanto, Japan');
    expect(result[2].displayName).toBe('Japan');
  });

  it('returns an empty array when reverse response has no locations list', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const result = await fetchLocationOptions(40.0, -74.0);
    expect(result).toEqual([]);
  });

  it('throws a typed error when reverse endpoint returns a non-2xx response', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      statusText: 'Forbidden',
    } as Response);

    await expect(fetchLocationOptions(1, 2)).rejects.toThrow(
      'Failed to fetch location options: Forbidden',
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  it('throws a generic error when fetch rejects with a non-Error value', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(global, 'fetch').mockRejectedValue('boom');

    await expect(fetchLocationOptions(1, 2)).rejects.toThrow(
      'Unknown error occurred while fetching location options.',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      '[locationServices]',
      'Unknown error fetching location options',
    );
  });
});
