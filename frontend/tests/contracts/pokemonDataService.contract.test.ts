// tests/contracts/pokemonDataService.contract.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import axios from 'axios';
import { getPokemons } from '@/services/pokemonDataService';
import type { BasePokemon } from '@/types/pokemonBase';
import { enableLogging, testLogger } from '../setupTests';
import pokemonFixtures from '../__helpers__/fixtures/pokemons.json' assert { type: 'json' };

// Mock axios for all tests
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Required fields that must be present in every Pokemon object
const requiredKeys: (keyof BasePokemon)[] = [
  'pokemon_id', 'name', 'pokedex_number',
  'attack', 'defense', 'stamina',
  'type_1_id', 'type_2_id', 'gender_rate',
  'rarity', 'form', 'generation',
  'available', 'shiny_available', 'shiny_rarity',
  'date_available', 'date_shiny_available',
  'female_unique', 'type1_name', 'type2_name',
  'shadow_shiny_available', 'shadow_apex',
  'date_shadow_available', 'date_shiny_shadow_available',
  'shiny_shadow_rarity', 'image_url',
  'image_url_shadow', 'image_url_shiny',
  'image_url_shiny_shadow', 'type_1_icon',
  'type_2_icon', 'costumes', 'moves',
  'fusion', 'cp40', 'cp50', 'sprite_url',
  'backgrounds', 'megaEvolutions', 'raid_boss', 'max'
];

// Optional fields that may be present
const optionalKeys: (keyof BasePokemon)[] = [
  'evolves_from',
  'evolves_to',
  'female_data',
  'sizes'
];

// Mock data for caching test - using first entry from fixtures
const mockPokemon = (pokemonFixtures as BasePokemon[])[0];

describe('Pokemon API Contract Tests', () => {
  const suiteStartTime = Date.now();
  let apiResponse: BasePokemon[];

  beforeAll(async () => {
    enableLogging('verbose');
    testLogger.fileStart('Pokemon API Contract Tests');
    testLogger.suiteStart('API Contract Validation');

    // Reset mocks before all tests
    vi.resetAllMocks();

    // Mock the initial API call with fixture data
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: pokemonFixtures as BasePokemon[],
      headers: {},
      config: {} as any,
      statusText: 'OK'
    });

    // Make the API call
    testLogger.testStep('Making API call to fetch Pokemon data');
    const startTime = Date.now();
    apiResponse = await getPokemons();
    testLogger.metric('API Response Time', `${Date.now() - startTime}ms`);
    testLogger.metric('Pokemon Count', apiResponse.length);
  });

  afterAll(() => {
    testLogger.complete('Contract Test Suite', Date.now() - suiteStartTime);
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  describe('API Response Schema', () => {
    it('validates response structure and required fields', async () => {
      const testStart = Date.now();
      try {
        testLogger.testStep('1. Validating response is an array');
        expect(Array.isArray(apiResponse)).toBe(true);
        expect(apiResponse.length).toBeGreaterThan(0);
        testLogger.assertion('Response is a non-empty array');

        testLogger.testStep('2. Getting sample Pokemon data');
        const sample = apiResponse[0];
        testLogger.metric('Sample Pokemon', sample.name);

        testLogger.testStep('3. Checking required fields');
        const sampleKeys = Object.keys(sample);
        const missingRequired = requiredKeys.filter(key => !sampleKeys.includes(key as string));
        expect(missingRequired).toEqual([]);
        testLogger.assertion('All required fields present');

        testLogger.testStep('4. Checking for unexpected fields');
        const allValidKeys = [...requiredKeys, ...optionalKeys];
        const unexpectedKeys = sampleKeys.filter(
          key => !allValidKeys.includes(key as keyof BasePokemon)
        );
        expect(unexpectedKeys).toEqual([]);
        testLogger.assertion('No unexpected fields present');

        testLogger.metric('Validation time', Date.now() - testStart);
      } catch (error) {
        testLogger.errorDetail(error);
        throw error;
      }
    });

    it('validates field types and constraints', () => {
      const testStart = Date.now();
      try {
        testLogger.testStep('1. Getting sample Pokemon data');
        const sample = apiResponse[0];

        testLogger.testStep('2. Validating field types');
        // Numeric fields
        ['pokemon_id', 'pokedex_number', 'attack', 'defense', 'stamina', 'type_1_id', 'type_2_id']
          .forEach(field => {
            expect(typeof sample[field as keyof BasePokemon]).toBe('number');
            expect(sample[field as keyof BasePokemon]).toBeGreaterThan(0);
            testLogger.assertion(`${field} is valid positive number`);
          });

        // String fields with constraints
        // Gender rate can be in format "M/F" or percentage based like "87M_12F_0GL"
        expect(sample.gender_rate).toMatch(/^(([MF]\/[MF])|(\d+M_\d+F(_\d+GL)?))$/);
        testLogger.assertion('gender_rate format is valid');

        // Rarity can be common, rare, legendary, mythical, or standard
        const validRarities = ['common', 'rare', 'legendary', 'mythical', 'standard'];
        expect(validRarities).toContain(sample.rarity.toLowerCase());
        testLogger.assertion('rarity value is valid');

        // Date fields
        ['date_available', 'date_shiny_available'].forEach(field => {
          const value = sample[field as keyof BasePokemon];
          if (value && value !== '') {
            expect(Date.parse(value as string)).not.toBeNaN();
            testLogger.assertion(`${field} is valid date`);
          }
        });

        testLogger.metric('Validation time', Date.now() - testStart);
      } catch (error) {
        testLogger.errorDetail(error);
        throw error;
      }
    });

    it('validates data consistency across multiple Pokemon', () => {
      const testStart = Date.now();
      try {
        testLogger.testStep('1. Checking multiple Pokemon entries');
        const sampleSize = Math.min(apiResponse.length, 10);
        const samples = apiResponse.slice(0, sampleSize);
        testLogger.metric('Sample size', sampleSize);

        testLogger.testStep('2. Validating consistent field presence');
        samples.forEach((pokemon, index) => {
          const missingFields = requiredKeys.filter(key => !(key in pokemon));
          expect(missingFields).toEqual([]);
          testLogger.assertion(`Pokemon ${index + 1} (${pokemon.name}) has all required fields`);

          // Validate relationships
          if (pokemon.evolves_from) {
            const preEvolution = apiResponse.find(p => p.pokemon_id === Number(pokemon.evolves_from));
            expect(preEvolution).toBeDefined();
            testLogger.assertion(`Evolution chain is valid for ${pokemon.name}`);
          }

          // Validate type consistency
          expect(pokemon.type1_name.toLowerCase()).toBe(
            apiResponse.find(p => p.type_1_id === pokemon.type_1_id)?.type1_name.toLowerCase()
          );
          testLogger.assertion(`Type consistency validated for ${pokemon.name}`);
        });

        testLogger.metric('Validation time', Date.now() - testStart);
      } catch (error) {
        testLogger.errorDetail(error);
        throw error;
      }
    });
  });
}); 