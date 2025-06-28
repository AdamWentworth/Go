// fetchAndProcessVariants.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { fetchAndProcessVariants } from '../../../../src/features/variants/utils/fetchAndProcessVariants';
import { useLivePokemons } from '../../../utils/livePokemonCache';
import { testLogger, enableLogging } from '../../../setupTests';

describe('🔗 Integration – fetchAndProcessVariants', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('End-to-End Integration Tests');
    testLogger.suiteStart('Variant Processing Pipeline');
  });

  afterAll(() => {
    testLogger.complete('End-to-End Test Suite', Date.now() - suiteStartTime);
    testLogger.suiteComplete();  // Add suite completion
    testLogger.fileEnd();        // Add file completion
    process.stdout.write('\n');
  });

  const suiteStartTime = Date.now();

  it('fetches from real API and transforms data end-to-end', async () => {
    const timerStart = Date.now();
    
    try {
      testLogger.testStep('1. Fetching original Pokémon data');
      const original = await useLivePokemons();
      testLogger.metric('Raw Pokémon count', original.length);
      expect(original.length).toBeGreaterThan(0);

      testLogger.testStep('2. Processing variants');
      const variants = await fetchAndProcessVariants();
      testLogger.metric('Generated variants', variants.length);
      expect(Array.isArray(variants)).toBe(true);
      testLogger.assertion('Received valid variants array');

      testLogger.testStep('3. Validating variant structure');
      const sample = variants[0];
      expect(sample.name).toBeDefined();
      expect(sample.variantType).toBeDefined();
      expect(sample.currentImage).toBeDefined();
      expect(sample.pokemonKey).toBeDefined();
      testLogger.assertion('Sample variant validation passed');
    } catch (error) {
      testLogger.errorDetail(error);
      throw error;
    } finally {
      testLogger.complete('End-to-End Test', Date.now() - timerStart);
    }
  }, 10000);
});