import { describe, expect, it } from 'vitest';

import {
  areInstanceIvsEmpty,
  getInitialCaughtNumericValue,
  getInitialCpText,
  getInitialGenderState,
  getInitialIvs,
  getInitialLevel,
  getInitialMaxMoveValue,
  getInitialMoves,
  getInitialOptionalNumericValue,
  normalizeIvsForState,
  parseEditableLevel,
} from '@/pages/Pokemon/features/instances/utils/instanceFormState';

describe('instanceFormState helpers', () => {
  it('normalizes common scalar fields from instance data', () => {
    expect(getInitialGenderState({ gender: 'Female' })).toEqual({
      gender: 'Female',
      isFemale: true,
    });
    expect(getInitialGenderState({})).toEqual({
      gender: null,
      isFemale: false,
    });
    expect(getInitialCpText({ cp: 1234 })).toBe('1234');
    expect(getInitialCpText({ cp: null })).toBe('');
    expect(getInitialLevel({ level: '20' as unknown as number })).toBe(20);
    expect(parseEditableLevel('40')).toBe(40);
    expect(parseEditableLevel('')).toBeNull();
  });

  it('keeps caught and trade numeric initialization semantics distinct', () => {
    expect(getInitialCaughtNumericValue(undefined)).toBe(0);
    expect(getInitialCaughtNumericValue('6.5')).toBe(6.5);
    expect(getInitialOptionalNumericValue(undefined)).toBe('');
    expect(getInitialOptionalNumericValue(0)).toBe('');
    expect(getInitialOptionalNumericValue('6.5')).toBe(6.5);
  });

  it('normalizes moves and IVs from instance data', () => {
    expect(
      getInitialMoves({
        fast_move_id: 1,
        charged_move1_id: null,
        charged_move2_id: 3,
      }),
    ).toEqual({
      fastMove: 1,
      chargedMove1: null,
      chargedMove2: 3,
    });
    expect(
      getInitialIvs({
        attack_iv: 15,
        defense_iv: null,
        stamina_iv: 0,
      }),
    ).toEqual({
      Attack: 15,
      Defense: '',
      Stamina: 0,
    });
  });

  it('normalizes editable IV inputs and detects empty sets', () => {
    expect(
      normalizeIvsForState({
        Attack: null,
        Defense: '',
        Stamina: 12,
      }),
    ).toEqual({
      Attack: '',
      Defense: '',
      Stamina: 12,
    });
    expect(areInstanceIvsEmpty({ Attack: '', Defense: null })).toBe(true);
    expect(areInstanceIvsEmpty({ Attack: '', Defense: 0, Stamina: null })).toBe(false);
  });

  it('normalizes max move form values', () => {
    expect(getInitialMaxMoveValue(undefined)).toBe('');
    expect(getInitialMaxMoveValue(null)).toBe('');
    expect(getInitialMaxMoveValue(3)).toBe('3');
  });
});
