// tests/unit/services/pokemonDataService.unit.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import axios from 'axios';
import { getPokemons } from '@/services/pokemonDataService';
import type { BasePokemon } from '@/types/pokemonBase';
import pokemonFixtures from '../../__helpers__/fixtures/pokemons.json' assert { type: 'json' };
import { enableLogging, testLogger } from '../../setupTests';

expect.extend(matchers);

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Pokemon Data Service Unit Tests', () => {
  const suiteStartTime = Date.now();

  // Use the first pokemon from our fixtures as test data
  const mockPokemonData: BasePokemon[] = [(pokemonFixtures as BasePokemon[])[0]];

  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Pokemon Data Service Unit Tests');
    testLogger.suiteStart('Service Method Tests');
  });

  afterAll(() => {
    testLogger.complete('Unit Test Suite', Date.now() - suiteStartTime);
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockedAxios.get.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('successfully fetches pokemon data', async () => {
    const testStart = Date.now();
    try {
      testLogger.testStep('1. Setting up mock response');
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockPokemonData
      });

      testLogger.testStep('2. Executing getPokemons');
      const result = await getPokemons();

      testLogger.testStep('3. Verifying results');
      expect(result).toEqual(mockPokemonData);
      testLogger.assertion('Response data matches expected');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/pokemons'),
        expect.objectContaining({
          headers: {},
          validateStatus: expect.any(Function)
        })
      );
      testLogger.assertion('API endpoint called correctly');

      testLogger.metric('Response time', Date.now() - testStart);
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    }
  });

  it('handles 304 response by using cached data', async () => {
    const testStart = Date.now();
    try {
      testLogger.testStep('1. Setting up cache and mock response');
      const cachedData = { data: mockPokemonData };
      localStorage.setItem('pokemonData', JSON.stringify(cachedData));
      
      mockedAxios.get.mockResolvedValueOnce({
        status: 304,
        data: null
      });

      testLogger.testStep('2. Executing getPokemons');
      const result = await getPokemons();

      testLogger.testStep('3. Verifying results');
      expect(result).toEqual(mockPokemonData);
      testLogger.assertion('Cached data retrieved successfully');

      testLogger.metric('Response time', Date.now() - testStart);
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    }
  });

  it('supports legacy raw-array cache shape on 304 response', async () => {
    const testStart = Date.now();
    try {
      testLogger.testStep('1. Setting up legacy cache shape and 304 response');
      localStorage.setItem('pokemonData', JSON.stringify(mockPokemonData));
      mockedAxios.get.mockResolvedValueOnce({
        status: 304,
        data: null
      });

      testLogger.testStep('2. Executing and verifying fallback');
      const result = await getPokemons();
      expect(result).toEqual(mockPokemonData);
      testLogger.assertion('Legacy raw-array cache handled correctly');

      testLogger.metric('Response time', Date.now() - testStart);
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    }
  });

  it('throws error on network failure', async () => {
    const testStart = Date.now();
    try {
      testLogger.testStep('1. Setting up network error');
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      testLogger.testStep('2. Executing and verifying error');
      await expect(getPokemons()).rejects.toThrow('Network Error');
      testLogger.assertion('Network error handled correctly');

      testLogger.metric('Response time', Date.now() - testStart);
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    }
  });

  it('handles malformed API response', async () => {
    const testStart = Date.now();
    try {
      testLogger.testStep('1. Setting up malformed response');
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: [{ 
          invalid_field: 'bad data',
          pokemon_id: 'not a number' 
        }]
      });

      testLogger.testStep('2. Executing getPokemons');
      const result = await getPokemons();

      testLogger.testStep('3. Verifying response handling');
      // We should just verify we got some response, type validation is for contract tests
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      testLogger.assertion('Response handled without error');

      testLogger.metric('Response time', Date.now() - testStart);
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    }
  });

  it('validates cached data structure before using it', async () => {
    const testStart = Date.now();
    try {
      testLogger.testStep('1. Setting up invalid cache data');
      localStorage.setItem('pokemonData', '{"invalid": "structure"}');
      
      // Mock axios to return 304 to trigger cache usage
      mockedAxios.get.mockResolvedValueOnce({
        status: 304,
        data: null,
        headers: {},
        config: {} as any,
        statusText: 'Not Modified'
      });

      testLogger.testStep('2. Executing and verifying error');
      // The function should throw when it can't parse the cache data
      await expect(async () => {
        const result = await getPokemons();
        if (!result) throw new Error('No cached data available');
        return result;
      }).rejects.toThrow('No cached data available');
      
      testLogger.assertion('Invalid cache data rejected');

      testLogger.metric('Response time', Date.now() - testStart);
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    }
  });

  it('constructs correct API URL based on environment', async () => {
    const testStart = Date.now();
    try {
      testLogger.testStep('1. Setting up mock response');
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockPokemonData,
        headers: {},
        config: {} as any,
        statusText: 'OK'
      });

      testLogger.testStep('2. Executing getPokemons');
      await getPokemons();

      testLogger.testStep('3. Verifying URL construction');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringMatching(/^https?:\/\/.*\/pokemons$/),
        expect.objectContaining({
          headers: {},
          validateStatus: expect.any(Function)
        })
      );
      testLogger.assertion('API URL properly constructed');

      testLogger.metric('Response time', Date.now() - testStart);
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    }
  });

  it('sends If-None-Match header when cached ETag exists', async () => {
    const testStart = Date.now();
    try {
      testLogger.testStep('1. Setting up cached ETag and mock response');
      localStorage.setItem('pokemonDataEtag', '"abc123"');
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: mockPokemonData,
        headers: { etag: '"abc123"' },
      });

      testLogger.testStep('2. Executing getPokemons');
      await getPokemons();

      testLogger.testStep('3. Verifying conditional request header');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/pokemons'),
        expect.objectContaining({
          headers: { 'If-None-Match': '"abc123"' },
          validateStatus: expect.any(Function),
        }),
      );
      testLogger.assertion('If-None-Match header sent');
      testLogger.metric('Response time', Date.now() - testStart);
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    }
  });
}); 
