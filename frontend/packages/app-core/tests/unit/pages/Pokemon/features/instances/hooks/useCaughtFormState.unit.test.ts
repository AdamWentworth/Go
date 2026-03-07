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
          pokeball: 'great_ball',
          is_traded: true,
          original_trainer_name: 'Trainer Blue',
          original_trainer_id: 'user-123',
          traded_date: '2026-02-18',
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
    expect(result.current.pokeball).toBe('great_ball');
    expect(result.current.isTraded).toBe(false);
    expect(result.current.originalTrainerName).toBe('Trainer Blue');
    expect(result.current.originalTrainerId).toBe('user-123');
    expect(result.current.tradedDate).toBe('2026-02-18');
    expect(result.current.isShadow).toBe(true);
    expect(result.current.isPurified).toBe(false);
  });

  it('normalizes timestamp-shaped traded dates for editing', () => {
    const { result } = renderHook(() =>
      useCaughtFormState({
        instanceData: {
          traded_date: '2026-02-18T11:45:00.000Z',
        },
      }),
    );

    expect(result.current.tradedDate).toBe('2026-02-18');
  });

  it('updates dependent fields through handlers', () => {
    const { result } = renderHook(() =>
      useCaughtFormState({
        instanceData: { gender: 'Male', shadow: true, purified: false, is_traded: false },
      }),
    );

    act(() => {
      result.current.handleIsTradedChange(true);
      result.current.handleGenderChange('Female');
      result.current.handlePurifyToggle(true);
      result.current.handlePokeballChange('ultra_ball');
      result.current.handleOriginalTrainerNameChange('Trainer Green');
      result.current.handleOriginalTrainerIdChange('user-777');
      result.current.handleTradedDateChange('2026-02-21');
      result.current.handleLuckyToggle(true);
      result.current.handleIsTradedChange(false);
    });

    expect(result.current.gender).toBe('Female');
    expect(result.current.isFemale).toBe(true);
    expect(result.current.isLucky).toBe(true);
    expect(result.current.isPurified).toBe(true);
    expect(result.current.isShadow).toBe(false);
    expect(result.current.isTraded).toBe(true);
    expect(result.current.pokeball).toBe('ultra_ball');
    expect(result.current.originalTrainerName).toBe('Trainer Green');
    expect(result.current.originalTrainerId).toBe('user-777');
    expect(result.current.tradedDate).toBe('2026-02-21');
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

  it('enforces shadow trade rule and allows trade after purification', () => {
    const { result } = renderHook(() =>
      useCaughtFormState({
        instanceData: { shadow: true, purified: false, is_traded: false, lucky: false },
      }),
    );

    act(() => {
      result.current.handleIsTradedChange(true);
    });
    expect(result.current.isTraded).toBe(false);

    act(() => {
      result.current.handlePurifyToggle(true);
      result.current.handleIsTradedChange(true);
    });
    expect(result.current.isShadow).toBe(false);
    expect(result.current.isPurified).toBe(true);
    expect(result.current.isTraded).toBe(true);
  });
});
