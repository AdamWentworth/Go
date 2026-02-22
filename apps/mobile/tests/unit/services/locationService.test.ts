import {
  fetchLocationSuggestions,
  MIN_LOCATION_QUERY_LENGTH,
} from '../../../src/services/locationService';

jest.mock('@pokemongonexus/shared-contracts/common', () => ({
  buildUrl: (base: string, path: string, query?: Record<string, unknown>) => {
    const qs = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) qs.append(key, String(value));
      });
    }
    const suffix = qs.toString();
    return `${base}${path}${suffix ? `?${suffix}` : ''}`;
  },
}));

jest.mock('../../../src/config/runtimeConfig', () => ({
  runtimeConfig: {
    api: {
      locationApiUrl: 'https://example.com/location',
    },
  },
}));

const makeOkResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

const makeErrorResponse = (status = 500): Response =>
  ({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => '',
  }) as Response;

describe('fetchLocationSuggestions', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty array for queries shorter than minimum length', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    const result = await fetchLocationSuggestions('ab');
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it(`requires at least ${MIN_LOCATION_QUERY_LENGTH} non-whitespace characters`, async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    const result = await fetchLocationSuggestions('  x  ');
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps API rows into LocationAutocompleteResult shape', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeOkResponse([
        {
          name: 'Paris',
          state_or_province: 'Ile-de-France',
          country: 'France',
          latitude: 48.8566,
          longitude: 2.3522,
        },
        { name: 'Lyon', country: 'France', latitude: 45.75, longitude: 4.85 },
      ]),
    );

    const result = await fetchLocationSuggestions('Paris');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      displayName: 'Paris, Ile-de-France, France',
      latitude: 48.8566,
      longitude: 2.3522,
    });
    expect(result[1]).toEqual({
      displayName: 'Lyon, France',
      latitude: 45.75,
      longitude: 4.85,
    });
  });

  it('sets null coordinates when latitude or longitude are missing from row', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeOkResponse([{ name: 'Somewhere', country: 'Unknown' }]),
    );

    const result = await fetchLocationSuggestions('Some');
    expect(result).toHaveLength(1);
    expect(result[0].latitude).toBeNull();
    expect(result[0].longitude).toBeNull();
    expect(result[0].displayName).toBe('Somewhere, Unknown');
  });

  it('returns empty array on non-ok response', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(makeErrorResponse(400));
    const result = await fetchLocationSuggestions('Berlin');
    expect(result).toEqual([]);
  });

  it('returns empty array when response body is not an array', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(makeOkResponse({ locations: [] }));
    const result = await fetchLocationSuggestions('Test');
    expect(result).toEqual([]);
  });

  it('includes the query string in the request URL', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeOkResponse([]));
    await fetchLocationSuggestions('London');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('query=London'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('builds display name from name only when state and country are absent', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeOkResponse([{ name: 'Atlantis' }]),
    );

    const result = await fetchLocationSuggestions('Atl');
    expect(result[0].displayName).toBe('Atlantis');
  });
});
