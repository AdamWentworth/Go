import { describe, expect, it } from 'vitest';

import {
  areTradeIvsEmpty,
  buildTradeInstancePatch,
  toTradeValidationFields,
} from '@/pages/Pokemon/features/instances/utils/tradeInstanceForm';

describe('tradeInstanceForm utils', () => {
  it('detects empty IV sets correctly', () => {
    expect(
      areTradeIvsEmpty({ Attack: '', Defense: '', Stamina: null }),
    ).toBe(true);
    expect(
      areTradeIvsEmpty({ Attack: 15, Defense: '', Stamina: null }),
    ).toBe(false);
  });

  it('builds validation fields and drops empty numeric values', () => {
    const fields = toTradeValidationFields({
      level: null,
      cp: '',
      ivs: { Attack: '', Defense: 13, Stamina: null },
      weight: '',
      height: 12,
    });

    expect(fields).toEqual({
      level: undefined,
      cp: undefined,
      ivs: {
        Attack: undefined,
        Defense: 13,
        Stamina: undefined,
      },
      weight: '',
      height: 12,
    });
  });

  it('builds patch payload using computed values when provided and strips trade-only metadata', () => {
    const patch = buildTradeInstancePatch({
      nickname: 'Lucky',
      cp: '123',
      gender: 'Female',
      weight: '',
      height: 12.5,
      moves: {
        fastMove: 1,
        chargedMove1: 2,
        chargedMove2: null,
      },
      level: 20,
      ivs: { Attack: 1, Defense: 2, Stamina: 3 },
      locationCaught: 'Seattle',
      dateCaught: '2026-02-17',
      isTraded: true,
      originalTrainerName: 'Ash',
      originalTrainerId: 'user-1',
      tradedDate: '2026-02-20T12:34:56.000Z',
      pokeball: 'great_ball',
      selectedBackgroundId: 17,
      crown: true,
      maxAttack: '',
      maxGuard: '2',
      maxSpirit: 'bad-number',
      computedValues: {
        cp: 777,
        level: 42,
        ivs: { Attack: 15, Defense: 14, Stamina: 13 },
      },
    });

    expect(patch).toMatchObject({
      nickname: 'Lucky',
      cp: 777,
      level: 42,
      attack_iv: 15,
      defense_iv: 14,
      stamina_iv: 13,
      is_traded: false,
      original_trainer_name: null,
      original_trainer_id: null,
      traded_date: null,
      pokeball: 'great_ball',
      location_card: '17',
      crown: true,
      max_attack: null,
      max_guard: 2,
      max_spirit: null,
      weight: null,
      height: 12.5,
    });
  });
});
