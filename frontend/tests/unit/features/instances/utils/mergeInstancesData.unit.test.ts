// tests/instances/unit/mergeInstancesData.unit.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mergeInstancesData } from '@/features/instances/utils/mergeInstancesData';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import { enableLogging, testLogger } from '../../setupTests';

/**
 * Minimal factory for a Pokémon instance.
 * Provides default flags; override only what you need.
 */
function makeInst(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    last_update: 0,
    is_owned: false,
    is_for_trade: false,
    is_wanted: false,
    is_unowned: true,
    mega: false,
    fusion: {},
    ...overrides,
  } as PokemonInstance;
}

describe('mergeInstancesData', () => {
  const username = 'alice';

  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('mergeInstancesData');
    testLogger.suiteStart('mergeInstancesData unit tests');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  it('keeps both keys when old and new have distinct prefixes', () => {
    testLogger.suiteStart('keeps both keys when old and new have distinct prefixes');

    testLogger.testStep('preparing old and new data with distinct prefixes');
    const oldData: Instances = {
      '001-foo_UUID1': makeInst({ is_unowned: true }),
    };
    const newData: Instances = {
      '002-bar_UUID2': makeInst({ is_unowned: true }),
    };

    testLogger.testStep('merging instances data');
    const merged = mergeInstancesData(
      { ...oldData },
      { ...newData },
      username,
    );

    testLogger.testStep('asserting both keys are retained');
    expect(Object.keys(merged).sort()).toEqual([
      '001-foo_UUID1',
      '002-bar_UUID2',
    ]);
    testLogger.assertion('both distinct keys are present');
    testLogger.suiteComplete();
  });

  it('prefers new owned over old unowned for same key', () => {
    testLogger.suiteStart('prefers new owned over old unowned for same key');

    testLogger.testStep('setting up old unowned and new owned instances');
    const key = '001-foo_UUID';
    const oldData: Instances = {
      [key]: makeInst({ is_unowned: true, last_update: 100 }),
    };
    const newData: Instances = {
      [key]: makeInst({ is_owned: true, is_unowned: false, last_update: 50 }),
    };

    testLogger.testStep('merging instances data');
    const merged = mergeInstancesData({ ...oldData }, { ...newData }, username);

    testLogger.testStep('asserting new owned instance is preferred');
    expect(merged[key].is_owned).toBe(true);
    testLogger.assertion('is_owned is true');
    expect(merged[key].last_update).toBe(50);
    testLogger.assertion('last_update from newData');
    testLogger.suiteComplete();
  });

  it('uses latest timestamp when neither entry is significant', () => {
    testLogger.suiteStart('uses latest timestamp when neither entry is significant');

    testLogger.testStep('setting up both entries as unowned with different timestamps');
    const key = '001-foo_UUID';
    const oldData: Instances = {
      [key]: makeInst({ is_unowned: true, last_update: 200 }),
    };
    const newData: Instances = {
      [key]: makeInst({ is_unowned: true, last_update: 100 }),
    };

    testLogger.testStep('merging instances data');
    const merged = mergeInstancesData({ ...oldData }, { ...newData }, username);

    testLogger.testStep('asserting latest timestamp is used');
    expect(merged[key].last_update).toBe(200);
    testLogger.assertion('last_update equals the newer timestamp');
    testLogger.suiteComplete();
  });

  it('excludes entries with mismatched username in newData', () => {
    testLogger.suiteStart('excludes entries with mismatched username in newData');

    testLogger.testStep('setting up oldData with bob and newData with alice');
    const a = '001-foo_UUID';
    const b = '002-bar_UUID';
    const oldData: Instances = {
      [a]: makeInst({ username: 'bob' }),
    };
    const newData: Instances = {
      [b]: makeInst({ username }),
    };

    testLogger.testStep('merging instances data');
    const merged = mergeInstancesData({ ...oldData }, { ...newData }, username);

    testLogger.testStep('asserting old mismatched user is removed');
    expect(merged).not.toHaveProperty(a);
    testLogger.assertion('property a is removed');
    testLogger.testStep('asserting new matching user is retained');
    expect(merged).toHaveProperty(b);
    testLogger.assertion('property b is present');
    testLogger.suiteComplete();
  });

  it('prunes unowned mega when an owned mega exists for same base', () => {
    testLogger.suiteStart('prunes unowned mega when an owned mega exists for same base');

    testLogger.testStep('setting up old unowned mega and new owned mega');
    const oldKey = '006-charizard_mega_x_UUID1';
    const newKey = '006-charizard_mega_x_UUID2';
    const oldData: Instances = {
      [oldKey]: makeInst({ mega: true, is_unowned: true, last_update: 10 }),
    };
    const newData: Instances = {
      [newKey]: makeInst({ mega: true, is_owned: true, is_unowned: false, last_update: 20 }),
    };

    testLogger.testStep('merging instances data');
    const merged = mergeInstancesData({ ...oldData }, { ...newData }, username);

    testLogger.testStep('asserting unowned mega is pruned');
    expect(merged).not.toHaveProperty(oldKey);
    testLogger.assertion('old unowned mega removed');
    testLogger.testStep('asserting owned mega is retained');
    expect(merged).toHaveProperty(newKey);
    testLogger.assertion('new owned mega present');
    testLogger.suiteComplete();
  });

  it('retains unowned mega when no owned mega exists', () => {
    testLogger.suiteStart('retains unowned mega when no owned mega exists');

    testLogger.testStep('setting up only unowned mega');
    const oldKey = '006-charizard_mega_x_UUID1';
    const oldData: Instances = {
      [oldKey]: makeInst({ mega: true, is_unowned: true, last_update: 10 }),
    };
    const newData: Instances = {};

    testLogger.testStep('merging instances data');
    const merged = mergeInstancesData({ ...oldData }, { ...newData }, username);

    testLogger.testStep('asserting unowned mega is retained');
    expect(merged).toHaveProperty(oldKey);
    testLogger.assertion('old unowned mega remains');
    testLogger.suiteComplete();
  });

  it('prunes unowned fusion when an owned fusion exists', () => {
    testLogger.suiteStart('prunes unowned fusion when an owned fusion exists');

    testLogger.testStep('setting up old unowned fusion and new owned fusion');
    const oldKey = '025-pikachu_fusion_123_UUID1';
    const newKey = '025-pikachu_fusion_123_UUID2';
    const oldData: Instances = {
      [oldKey]: makeInst({ fusion: { '123': true }, is_unowned: true, last_update: 5 }),
    };
    const newData: Instances = {
      [newKey]: makeInst({ fusion: { '123': true }, is_owned: true, is_unowned: false, last_update: 15 }),
    };

    testLogger.testStep('merging instances data');
    const merged = mergeInstancesData({ ...oldData }, { ...newData }, username);

    testLogger.testStep('asserting unowned fusion is pruned');
    expect(merged).not.toHaveProperty(oldKey);
    testLogger.assertion('old unowned fusion removed');
    testLogger.testStep('asserting owned fusion is retained');
    expect(merged).toHaveProperty(newKey);
    testLogger.assertion('new owned fusion present');
    testLogger.suiteComplete();
  });

  it('keeps only one unowned placeholder per prefix when no owned or wanted', () => {
    testLogger.suiteStart('keeps only one unowned placeholder per prefix when no owned or wanted');

    testLogger.testStep('setting up two unowned placeholders with same prefix');
    const a1 = '010-weedle_UUID1';
    const a2 = '010-weedle_UUID2';
    const oldData: Instances = {
      [a1]: makeInst({ is_unowned: true, last_update: 5 }),
      [a2]: makeInst({ is_unowned: true, last_update: 6 }),
    };
    const newData: Instances = {};

    testLogger.testStep('merging instances data');
    const merged = mergeInstancesData({ ...oldData }, { ...newData }, username);

    testLogger.testStep('asserting only one placeholder remains');
    expect(Object.keys(merged)).toHaveLength(1);
    const remaining = Object.keys(merged)[0];
    expect([a1, a2]).toContain(remaining);
    testLogger.assertion('one unowned placeholder kept');
    testLogger.suiteComplete();
  });
});