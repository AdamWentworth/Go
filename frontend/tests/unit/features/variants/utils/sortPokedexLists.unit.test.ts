// tests/unit/sortPokedexLists.unit.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enableLogging, testLogger } from '../../../../setupTests';
import sortLists from '@/features/variants/utils/sortPokedexLists';
import { useLiveVariants } from '../../../../utils/liveVariantCache';
import type { PokemonVariant } from '@/types/pokemonVariants';

const LIST_MAPPING: Record<keyof ReturnType<typeof sortLists>, RegExp[]> = {
  default: [/^default$/, /^unknown$/],
  shiny: [/^shiny$/],
  costume: [/^costume_[^_]+$/],
  shadow: [/^shadow$/],
  'shiny costume': [/^costume_[^_]+_shiny$/],
  'shiny shadow': [/^shiny_shadow$/],
  'shadow costume': [/^shadow_costume_[^_]+$/],
  mega: [/^mega$/, /^mega_[xy]$/, /^primal$/],
  'shiny mega': [/^shiny_mega(?:$|_.*)$/, /^shiny_primal(?:$|_.*)$/],
  dynamax: [/^dynamax$/],
  'shiny dynamax': [/^shiny_dynamax$/],
  gigantamax: [/^gigantamax$/],
  'shiny gigantamax': [/^shiny_gigantamax$/],
  fusion: [/^fusion_[^_]+$/],
  'shiny fusion': [/^shiny_fusion_[^_]+$/]
};

describe('🗂️ Unit – sortPokedexLists', () => {
  const suiteStart = Date.now();
  let variants: PokemonVariant[] = [];

  beforeAll(async () => {
    enableLogging('verbose');
    testLogger.fileStart('Sort Pokedex Lists');
    testLogger.suiteStart('Variant Classification');

    testLogger.testStep('Fetching live variants');
    variants = await useLiveVariants();
    testLogger.metric('Total Variants Available', variants.length);
  });

  afterAll(() => {
    testLogger.complete('Sort Pokedex Lists Suite', Date.now() - suiteStart);
    testLogger.suiteComplete();
    testLogger.fileEnd();
    testLogger.fileSeparator();
  });

  it('classifies all variants into appropriate lists', () => {
    testLogger.testStep('Validating classification');
    const lists = sortLists(variants);
    const allSorted = Object.values(lists).flat();

    // Verify all variants are sorted
    expect(allSorted).toHaveLength(variants.length);
    testLogger.assertion('All variants accounted for in lists');

    // Verify list membership
    Object.entries(LIST_MAPPING).forEach(([listKey, patterns]) => {
      const expectedCount = variants.filter(v => 
        patterns.some(pattern => pattern.test(v.variantType)))
        .length;
      
      const actualCount = lists[listKey as keyof typeof lists].length;
      // Log how many variants ended up in this list
      testLogger.metric(`Count for '${listKey}'`, actualCount);
      
      if (expectedCount !== actualCount) {
        const errorMessage = `Mismatch in ${listKey}: expected ${expectedCount}, got ${actualCount}. Variants: ${JSON.stringify(lists[listKey as keyof typeof lists].map(v => v.variantType))}`;
        testLogger.errorDetail(errorMessage);
      }

      expect(lists[listKey as keyof typeof lists]).toHaveLength(expectedCount);
    });
    
    testLogger.assertion('All variants sorted into correct lists');
  });

  it('handles empty input correctly', () => {
    testLogger.testStep('Testing empty input');
    const lists = sortLists([]);
    
    Object.keys(LIST_MAPPING).forEach(listKey => {
      expect(lists[listKey as keyof typeof lists]).toHaveLength(0);
    });
    testLogger.assertion('Empty input handled properly');
  });
});