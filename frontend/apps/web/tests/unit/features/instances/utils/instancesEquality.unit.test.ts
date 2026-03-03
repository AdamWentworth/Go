import { describe, it, expect } from 'vitest';
import { areInstancesEqual } from '@/features/instances/utils/instancesEquality';

describe('areInstancesEqual', () => {
  it('returns true for equal instance maps', () => {
    const a = {
      i1: { instance_id: 'i1', nickname: 'Pika', cp: 500 },
      i2: { instance_id: 'i2', nickname: 'Eevee', cp: 600 },
    } as any;
    const b = {
      i1: { instance_id: 'i1', nickname: 'Pika', cp: 500 },
      i2: { instance_id: 'i2', nickname: 'Eevee', cp: 600 },
    } as any;

    expect(areInstancesEqual(a, b)).toBe(true);
  });

  it('returns false when a field value changes', () => {
    const a = {
      i1: { instance_id: 'i1', nickname: 'Pika', cp: 500 },
    } as any;
    const b = {
      i1: { instance_id: 'i1', nickname: 'Pika', cp: 501 },
    } as any;

    expect(areInstancesEqual(a, b)).toBe(false);
  });

  it('returns false when keys differ', () => {
    const a = {
      i1: { instance_id: 'i1', cp: 500 },
    } as any;
    const b = {
      i1: { instance_id: 'i1', cp: 500 },
      i2: { instance_id: 'i2', cp: 600 },
    } as any;

    expect(areInstancesEqual(a, b)).toBe(false);
  });
});

