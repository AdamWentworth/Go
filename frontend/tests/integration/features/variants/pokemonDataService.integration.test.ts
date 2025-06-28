// src/services/tests/pokemonDataService.integration.test.ts
import { useLivePokemons } from '../../../utils/livePokemonCache';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enableLogging, testLogger } from '../../../setupTests';

const requiredKeys = [
  'attack', 'available', 'costumes', 'cp40', 'cp50',
  'date_available', 'defense', 'evolves_to',
  'female_unique', 'form', 'fusion', 'gender_rate',
  'generation', 'image_url', 'image_url_shiny',
  'image_url_shadow', 'image_url_shiny_shadow',
  'max', 'megaEvolutions', 'moves', 'name',
  'pokedex_number', 'pokemon_id', 'raid_boss', 'rarity',
  'shadow_apex', 'shadow_shiny_available', 'shiny_available',
  'shiny_rarity', 'shiny_shadow_rarity', 'sizes',
  'sprite_url', 'stamina', 'type1_name', 'type2_name',
  'type_1_icon', 'type_1_id', 'type_2_icon', 'type_2_id',
];

const optionalKeys = [
  'evolves_from', 'female_data', 'shadow_image_url', 
  'shiny_image_url','shiny_shadow_image_url', 'date_shiny_available',
  'date_shadow_available', 'date_shiny_shadow_available',
  'backgrounds',
];

describe('📡 Pokemon Data Service Integration', () => {
  const suiteStartTime = Date.now();

  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Data Service Integration Tests');
    testLogger.suiteStart('API Contract Validation');

    // Clear the in-memory test cache so we do one real HTTP call
    // @ts-ignore
    delete globalThis.__POKEMON_FIXTURE__;
  });

  afterAll(() => {
    testLogger.complete('API Test Suite', Date.now() - suiteStartTime);
    testLogger.suiteComplete();
    testLogger.fileEnd();
    process.stdout.write('\n');
  });

  it('ensures Pokémon data contract stability', async () => {
    const timerStart = Date.now();
    try {
      testLogger.testStep('1. Initiating API request');
      const data = await useLivePokemons();
      testLogger.metric('Response time', `${Date.now() - timerStart}ms`);
      testLogger.metric('Data items received', data.length);

      testLogger.testStep('2. Validating response schema');
      const sample = data[0];
      const sampleKeys = Object.keys(sample);

      testLogger.testStep('2a. Checking required keys');
      const missing = requiredKeys.filter(k => !sampleKeys.includes(k));
      expect(missing).toEqual([]);
      testLogger.assertion('Required fields present');

      testLogger.testStep('2b. Checking for unexpected keys');
      const unexpected = sampleKeys.filter(k => ![...requiredKeys, ...optionalKeys].includes(k));
      expect(unexpected).toEqual([]);
      testLogger.assertion('No unexpected fields');
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    } finally {
      testLogger.complete('Schema Validation Test', Date.now() - timerStart);
    }
  });
});