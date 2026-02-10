import { describe, expect, it } from 'vitest';

import { mergeInstancesData } from '@/features/instances/utils/mergeInstancesData';
import type { Instances } from '@/types/instances';

function makeInst(overrides: Record<string, unknown> = {}) {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    is_caught: false,
    is_for_trade: false,
    is_wanted: false,
    registered: false,
    last_update: 0,
    ...overrides,
  } as any;
}

describe('mergeInstancesData', () => {
  const username = 'alice';

  it('keeps baselines for distinct variants', () => {
    const oldData: Instances = {
      oldA: makeInst({ variant_id: '0001-default' }),
    };
    const newData: Instances = {
      newB: makeInst({ variant_id: '0002-default', pokemon_id: 2 }),
    };

    const merged = mergeInstancesData(oldData, newData, username);

    expect(Object.keys(merged).sort()).toEqual(['newB', 'oldA']);
  });

  it('prefers significant server row for same instance id', () => {
    const key = 'same-id';
    const oldData: Instances = {
      [key]: makeInst({ last_update: 200, is_caught: false }),
    };
    const newData: Instances = {
      [key]: makeInst({ last_update: 100, is_caught: true, registered: true }),
    };

    const merged = mergeInstancesData(oldData, newData, username);

    expect((merged as any)[key].is_caught).toBe(true);
    expect((merged as any)[key].last_update).toBe(100);
  });

  it('uses latest timestamp when neither old/new row is significant', () => {
    const key = 'same-id';
    const oldData: Instances = {
      [key]: makeInst({ last_update: 200 }),
    };
    const newData: Instances = {
      [key]: makeInst({ last_update: 100 }),
    };

    const merged = mergeInstancesData(oldData, newData, username);

    expect((merged as any)[key].last_update).toBe(200);
  });

  it('filters mismatched username entries', () => {
    const merged = mergeInstancesData(
      {
        a: makeInst({ username: 'bob' }),
      },
      {
        b: makeInst({ username }),
      },
      username,
    );

    expect(merged).not.toHaveProperty('a');
    expect(merged).toHaveProperty('b');
  });

  it('prunes mega baseline placeholder when caught mega exists in server payload', () => {
    const merged = mergeInstancesData(
      {
        placeholder: makeInst({
          variant_id: '0006-mega_x',
          pokemon_id: 6,
          registered: false,
        }),
      },
      {
        caughtMega: makeInst({
          variant_id: '0006-mega_x',
          pokemon_id: 6,
          mega: true,
          is_caught: true,
          registered: true,
        }),
      },
      username,
    );

    expect(merged).not.toHaveProperty('placeholder');
    expect(merged).toHaveProperty('caughtMega');
  });

  it('keeps only one baseline per variant when no significant rows exist', () => {
    const merged = mergeInstancesData(
      {
        p1: makeInst({ variant_id: '0010-default', last_update: 5 }),
        p2: makeInst({ variant_id: '0010-default', last_update: 6 }),
      },
      {},
      username,
    );

    expect(Object.keys(merged)).toHaveLength(1);
    expect(Object.keys(merged)[0]).toBe('p1');
  });
});
