import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCaughtFormState } from '@/pages/Pokemon/features/instances/hooks/useCaughtFormState';

describe('useCaughtFormState', () => {
  it('initializes core fields from instance data', () => {
    const { result } = renderHook(() =>
      useCaughtFormState({
        instanceData: {
          gender: 'Female',
          nickname: 'Sparky',
          cp: 500,
          level: 20,
          attack_iv: 1,
          defense_iv: 2,
          stamina_iv: 3,
          shadow: true,
          purified: false,
        },
      }),
    );

    expect(result.current.gender).toBe('Female');
    expect(result.current.isFemale).toBe(true);
    expect(result.current.nickname).toBe('Sparky');
    expect(result.current.cp).toBe('500');
    expect(result.current.level).toBe(20);
    expect(result.current.ivs).toEqual({ Attack: 1, Defense: 2, Stamina: 3 });
    expect(result.current.isShadow).toBe(true);
    expect(result.current.isPurified).toBe(false);
  });

  it('updates dependent fields through handlers', () => {
    const { result } = renderHook(() =>
      useCaughtFormState({
        instanceData: { gender: 'Male', shadow: true, purified: false },
      }),
    );

    act(() => {
      result.current.handleGenderChange('Female');
      result.current.handlePurifyToggle(true);
    });

    expect(result.current.gender).toBe('Female');
    expect(result.current.isFemale).toBe(true);
    expect(result.current.isPurified).toBe(true);
    expect(result.current.isShadow).toBe(false);
  });

  it('applies computed values to editable fields', () => {
    const { result } = renderHook(() =>
      useCaughtFormState({
        instanceData: { cp: 300, level: 10, attack_iv: 1, defense_iv: 1, stamina_iv: 1 },
      }),
    );

    act(() => {
      result.current.applyComputedValues({
        cp: 999,
        level: 40,
        ivs: { Attack: 15, Defense: 14, Stamina: 13 },
      });
    });

    expect(result.current.cp).toBe('999');
    expect(result.current.level).toBe(40);
    expect(result.current.ivs).toEqual({ Attack: 15, Defense: 14, Stamina: 13 });
  });
});

