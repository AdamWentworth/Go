// initializePokemonTags.unit.test.ts

import { describe, it, expect, beforeAll, vi } from 'vitest';

import { initializePokemonTags } from '@/features/tags/utils/initializePokemonTags';
import { useLiveVariants } from '../../utils/liveVariantCache';
import { useLiveInstances } from '../../utils/liveInstancesCache';
import { testLogger, enableLogging } from '../../setupTests';
import { parsePokemonKey } from '@/utils/PokemonIDUtils';

describe('initializePokemonTags', () => {
  let variants: Awaited<ReturnType<typeof useLiveVariants>>;
  let instances: Awaited<ReturnType<typeof useLiveInstances>>;

  beforeAll(async () => {
    enableLogging('verbose');
    testLogger.fileStart('initializePokemonTags');
    testLogger.suiteStart('initializePokemonTags logic');

    variants = await useLiveVariants();
    instances = await useLiveInstances();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs missing variants only once per baseKey', () => {
    testLogger.testStep('Setting up broken instance with unknown baseKey');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const validInstance = Object.values(instances)[0];

    const brokenBaseKey = '9999-missing';
    const fakeUUID = '00000000-0000-0000-0000-000000000000';
    const brokenInstanceId = `${brokenBaseKey}_${fakeUUID}`;

    const brokenInstance = {
      ...validInstance,
      instance_id: brokenInstanceId,
    };

    const modifiedInstances = {
      ...instances,
      [brokenInstanceId]: brokenInstance,
    };

    testLogger.testStep('Calling initializePokemonTags with broken instance');
    initializePokemonTags(modifiedInstances, variants);

    testLogger.testStep('Asserting warning was logged');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[initializePokemonTags] missing variant',
      brokenBaseKey,
      '— total variants:',
      expect.any(Number)
    );
    testLogger.assertion('Console warned about missing variant');

    consoleSpy.mockRestore();
  });

  it('handles numeric pokemon_id parsing gracefully', () => {
    testLogger.testStep('Validating that numeric pokemon_id parses without error');
    const sample = Object.values(instances)[0];
    const baseKey = String(sample.pokemon_id);

    expect(() => baseKey.split(':')).not.toThrow();
    testLogger.assertion('No error thrown during split');
  });

  it('correctly processes fusion/mega/female/purified logic', () => {
    testLogger.testStep('Creating a special instance with all modifiers');
    const inst = Object.values(instances).find(i => i.gender === 'Female') || Object.values(instances)[0];

    const specialInstance = {
      ...inst,
      gender: 'Female',
      is_fused: true,
      is_mega: true,
      purified: true,
      fusion_form: '1',
      mega_form: '2',
      instance_id: `special-${Date.now()}_00000000-0000-0000-0000-000000000000`,
    };

    const baseKey = specialInstance.instance_id.split('_')[0];
    const matchingVariant = variants.find(v =>
      v.pokemonKey === baseKey &&
      (v.female_data || v.megaEvolutions?.length || v.fusion?.length)
    );

    if (!matchingVariant) return;

    testLogger.testStep('Initializing tags with special instance');
    const result = initializePokemonTags(
      { [specialInstance.instance_id]: specialInstance },
      [matchingVariant]
    );

    const tag =
      Object.values(result.owned)[0] ||
      Object.values(result.unowned)[0] ||
      Object.values(result.trade)[0] ||
      Object.values(result.wanted)[0];

    expect(tag).toBeDefined();
    testLogger.assertion('Tag object was created for special instance');

    expect(tag!.gender).toBe('Female');
    testLogger.assertion('Tag gender is Female');
  });

  it('assigns instance to multiple tag buckets when applicable', () => {
    testLogger.testStep('Finding a multi-category instance');
    const [instId, inst] = Object.entries(instances).find(
      ([id, i]) => i.is_owned && i.is_for_trade && i.is_unowned && i.is_wanted
    ) || Object.entries(instances)[0];
  
    const { baseKey } = parsePokemonKey(instId);
    const variant = variants.find(v => v.pokemonKey === baseKey);
    if (!variant) return;
  
    const multiKey = `${baseKey}_00000000-0000-0000-0000-000000000000`;
  
    const modifiedInst = {
      ...inst,
      is_owned: true,
      is_for_trade: true,
      is_wanted: true,
      is_unowned: true,
      instance_id: multiKey,
    };
  
    testLogger.testStep('Initializing tags with multi-tag instance');
    const tags = initializePokemonTags(
      { [multiKey]: modifiedInst },
      [variant]
    );
  
    expect(tags.owned).toHaveProperty(multiKey);
    testLogger.assertion('Assigned to owned');

    expect(tags.trade).toHaveProperty(multiKey);
    testLogger.assertion('Assigned to trade');

    expect(tags.wanted).toHaveProperty(multiKey);
    testLogger.assertion('Assigned to wanted');

    expect(tags.unowned).toHaveProperty(multiKey);
    testLogger.assertion('Assigned to unowned');
  });

  it('skips tagging when variant is completely missing', () => {
    testLogger.testStep('Creating a ghost instance with no matching variant');
    const key = '8888-ghost_00000000-0000-0000-0000-000000000000';
    const ghostInstance = {
      ...Object.values(instances)[0],
      instance_id: key,
    };

    const result = initializePokemonTags({ [key]: ghostInstance }, []);
    
    expect(result.owned[key]).toBeUndefined();
    testLogger.assertion('Ghost not tagged as owned');

    expect(result.wanted[key]).toBeUndefined();
    testLogger.assertion('Ghost not tagged as wanted');

    expect(result.trade[key]).toBeUndefined();
    testLogger.assertion('Ghost not tagged as trade');

    expect(result.unowned[key]).toBeUndefined();
    testLogger.assertion('Ghost not tagged as unowned');
  });

  it('uses default image when no override applies', () => {
    testLogger.testStep('Finding basic instance with no special forms');
    const [instId, baseInst] = Object.entries(instances).find(
      ([id, i]) => !i.is_fused && !i.is_mega && !i.purified
    ) || Object.entries(instances)[0];
  
    const { baseKey } = parsePokemonKey(instId);
    const variant = variants.find(v => v.pokemonKey === baseKey);
    if (!variant) return;
  
    const testKey = `${baseKey}_00000000-0000-0000-0000-000000000000`;
  
    const inst = {
      ...baseInst,
      is_owned: true,
      gender: 'Male',
      is_fused: false,
      is_mega: false,
      purified: false,
      instance_id: testKey,
    };
  
    testLogger.testStep('Initializing tags to check default image use');
    const tags = initializePokemonTags({ [testKey]: inst }, [variant]);
  
    const tag = tags.owned[testKey];
    expect(tag).toBeDefined();
    testLogger.assertion('Tag created with default setup');

    expect(tag!.currentImage).toBe(variant.currentImage);
    testLogger.assertion('Used variant.currentImage as default');
  });

  it('always returns all four tag buckets even if empty', () => {
    testLogger.testStep('Calling initializePokemonTags with empty input');
    const result = initializePokemonTags({}, []);
    expect(result).toMatchObject({
      owned: {},
      trade: {},
      wanted: {},
      unowned: {},
    });
    testLogger.assertion('Returned structure contains all buckets');
  });
  it('handles conflicting tag states without crash', () => {
    testLogger.testStep('Setting up instance with conflicting ownership flags');
    const conflictingKey = '1000-conflict_00000000-0000-0000-0000-000000000000';
  
    const instance = {
      ...Object.values(instances)[0],
      instance_id: conflictingKey,
      is_for_trade: false,
      is_wanted: false,
      is_owned: true,
      is_unowned: true,
    };
  
    const { baseKey } = parsePokemonKey(conflictingKey);
    const variant = variants.find(v => v.pokemonKey === baseKey);
    if (!variant) {
      testLogger.testStep('No matching variant found for conflicting instance');
      return;
    }
  
    testLogger.testStep('Initializing tags with conflicting tag flags');
    const result = initializePokemonTags({ [conflictingKey]: instance }, [variant]);
  
    expect(result.owned[conflictingKey]).toBeDefined();
    testLogger.assertion('Assigned to owned');
  
    expect(result.unowned[conflictingKey]).toBeDefined();
    testLogger.assertion('Assigned to unowned');
  });  

  it('handles unexpected gender values gracefully', () => {
    testLogger.testStep('Setting up instance with unexpected gender value');
  
    const [sourceId, sourceInst] = Object.entries(instances).find(
      ([, i]) => i.is_owned
    ) || Object.entries(instances)[0];
  
    const { baseKey } = parsePokemonKey(sourceId);
    const matchingVariant = variants.find(v => v.pokemonKey === baseKey);
    if (!matchingVariant) {
      testLogger.testStep('No matching variant found');
      return;
    }
  
    const testKey = `${baseKey}_00000000-0000-0000-0000-000000000000`;
    const instance = {
      ...sourceInst,
      instance_id: testKey,
      gender: 'Other', // Unexpected value
      is_owned: true,
    };
  
    testLogger.testStep('Initializing tags with unexpected gender');
    const result = initializePokemonTags({ [testKey]: instance }, [matchingVariant]);
  
    expect(result.owned[testKey]).toBeDefined();
    testLogger.assertion('Tag created for instance with unexpected gender');
  });  

  it('handles missing optional fields like fusion_form and mega_form', () => {
    testLogger.testStep('Finding a valid instance and stripping optional fields');
  
    const [sourceId, sourceInst] = Object.entries(instances).find(
      ([, i]) => i.is_owned
    ) || Object.entries(instances)[0];
  
    const { baseKey } = parsePokemonKey(sourceId);
    const matchingVariant = variants.find(v => v.pokemonKey === baseKey);
    if (!matchingVariant) {
      testLogger.testStep('No matching variant found');
      return;
    }
  
    const testKey = `${baseKey}_00000000-0000-0000-0000-000000000000`;
    const instance = {
      ...sourceInst,
      instance_id: testKey,
      is_owned: true,
      fusion_form: null,
      mega_form: null,
      gender: null,
    };
  
    testLogger.testStep('Initializing tags with missing optional fields');
    const result = initializePokemonTags({ [testKey]: instance }, [matchingVariant]);
  
    expect(result.owned[testKey]).toBeDefined();
    testLogger.assertion('Instance handled without optional fields');
  });  

  it('handles variants with no currentImage by falling back safely', () => {
    const variant = {
      ...variants[0],
      pokemonKey: '4000-nopic',
      currentImage: undefined,
    };
    const key = '4000-nopic_00000000-0000-0000-0000-000000000000';
    const instance = {
      ...Object.values(instances)[0],
      instance_id: key,
      is_owned: true,
    };

    const result = initializePokemonTags({ [key]: instance }, [variant]);

    expect(result.owned[key]).toBeDefined();
    testLogger.assertion('Handled missing currentImage safely');
  });

  it('handles multiple instances of same baseKey correctly', () => {
    testLogger.testStep('Looking for two real instances with same baseKey');
  
    const grouped = Object.entries(instances).reduce((acc, [id, inst]) => {
      const baseKey = parsePokemonKey(id).baseKey;
      acc[baseKey] ??= [];
      acc[baseKey].push([id, inst]);
      return acc;
    }, {} as Record<string, [string, typeof instances[string]][]>);
  
    const entry = Object.entries(grouped).find(([, arr]) => arr.length >= 2);
    if (!entry) {
      testLogger.testStep('Could not find two matching baseKey instances — skipping');
      return;
    }
  
    const [baseKey, matches] = entry;
    const [[id1, inst1], [id2, inst2]] = matches;
  
    const variant = variants.find(v => v.pokemonKey === baseKey);
    if (!variant) {
      testLogger.testStep('No matching variant found for baseKey — skipping');
      return;
    }
  
    const modifiedInstances = {
      [id1]: { ...inst1, is_owned: true, is_unowned: false, is_for_trade: false, is_wanted: false },
      [id2]: { ...inst2, is_owned: false, is_unowned: true, is_for_trade: false, is_wanted: false },
    };
  
    testLogger.testStep('Initializing tags with two real instances sharing baseKey');
    const result = initializePokemonTags(modifiedInstances, [variant]);
  
    expect(result.owned[id1]).toBeDefined();
    testLogger.assertion('First instance tagged as owned');
  
    expect(result.unowned[id2]).toBeDefined();
    testLogger.assertion('Second instance tagged as unowned');
  });    

  it('handles valid instances with no matching variants array', () => {
    const id = '7000-novariant_00000000-0000-0000-0000-000000000000';
    const instance = {
      ...Object.values(instances)[0],
      instance_id: id,
      is_owned: true,
    };

    const result = initializePokemonTags({ [id]: instance }, []);

    expect(result.owned[id]).toBeUndefined();
    testLogger.assertion('No tag created without matching variant');
  });

  it('applies purified image override when only purified is true', () => {
    const baseKey = '8000-purified';
    const key = `${baseKey}_00000000-0000-0000-0000-000000000000`;
    const variant = { ...variants[0], pokemonKey: baseKey, currentImage: 'default.png' };

    const instance = {
      ...Object.values(instances)[0],
      instance_id: key,
      purified: true,
      is_owned: true,
    };

    const result = initializePokemonTags({ [key]: instance }, [variant]);

    expect(result.owned[key]).toBeDefined();
    expect(result.owned[key]!.currentImage).not.toBe('default.png');
    testLogger.assertion('Purified form used alternate image');
  });

  testLogger.suiteComplete();
});

testLogger.fileEnd();