import { persistNativeInstanceDetailMutation } from '../../../../src/features/collection/nativeInstanceDetailMutation';
import type { NativeCollectionSnapshot } from '../../../../src/services/collectionApi';

const snapshot = {
  catalog: [],
  instances: {
    'instance-1': {
      instance_id: 'instance-1',
      variant_id: '0003-default',
      pokemon_id: 3,
      nickname: null,
      cp: 2000,
      level: 40,
      attack_iv: 10,
      defense_iv: 10,
      stamina_iv: 10,
      shiny: false,
      costume_id: null,
      lucky: false,
      shadow: false,
      purified: false,
      fast_move_id: null,
      charged_move1_id: null,
      charged_move2_id: null,
      weight: null,
      height: null,
      gender: null,
      mega: false,
      mega_form: null,
      is_mega: false,
      dynamax: false,
      gigantamax: false,
      crown: false,
      max_attack: null,
      max_guard: null,
      max_spirit: null,
      is_fused: false,
      fusion: null,
      fusion_form: null,
      fused_with: null,
      is_traded: false,
      traded_date: null,
      original_trainer_id: null,
      original_trainer_name: null,
      is_caught: true,
      is_for_trade: false,
      is_wanted: false,
      most_wanted: false,
      caught_tags: [],
      trade_tags: [],
      wanted_tags: [],
      not_trade_list: null,
      not_wanted_list: null,
      trade_filters: null,
      wanted_filters: null,
      mirror: false,
      pref_lucky: false,
      friendship_level: null,
      registered: true,
      favorite: false,
      disabled: false,
      pokeball: null,
      location_card: null,
      location_caught: null,
      date_caught: null,
      date_added: '2026-01-01T00:00:00.000Z',
      last_update: 100,
    },
  },
} satisfies NativeCollectionSnapshot;

const makeOutbox = () => ({
  queue: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue([]),
  markAttemptFailed: jest.fn().mockResolvedValue(undefined),
  markAcknowledged: jest.fn().mockResolvedValue(undefined),
  removeAcknowledged: jest.fn().mockResolvedValue(undefined),
});

describe('persistNativeInstanceDetailMutation', () => {
  it('queues a validated canonical instance patch and updates local state first', async () => {
    const outbox = makeOutbox();
    const receiverClient = { post: jest.fn().mockResolvedValue({ accepted: true }) };
    const onQueued = jest.fn();
    const result = await persistNativeInstanceDetailMutation({
      userId: 'user-1',
      snapshot,
      requestedInstanceId: 'instance-1',
      patch: {
        nickname: '  BulbaBuddy  ',
        cp: 2222,
        level: 40.5,
        attack_iv: 15,
        location_caught: '  Burnaby, British Columbia  ',
        lucky: true,
        is_traded: true,
        original_trainer_name: '  TradePartner  ',
        pokeball: 'beast_ball',
        max_attack: '3',
        max_guard: 2,
        max_spirit: 0,
      },
      outbox,
      receiverClient,
      onQueued,
      syncBatchId: 'batch-1',
      now: 200,
    });

    expect(result.mutation.updated).toEqual(expect.objectContaining({
      nickname: 'BulbaBuddy',
      cp: 2222,
      level: 40.5,
      attack_iv: 15,
      location_caught: 'Burnaby, British Columbia',
      lucky: true,
      is_traded: true,
      original_trainer_name: 'TradePartner',
      pokeball: 'beast_ball',
      max_attack: 3,
      max_guard: 2,
      max_spirit: 0,
      last_update: 200,
    }));
    expect(outbox.queue).toHaveBeenCalledTimes(1);
    expect(onQueued).toHaveBeenCalledWith(result.mutation);
  });

  it.each([
    [{ cp: 9 }, 'CP must be between 10 and 100000.'],
    [{ level: 40.25 }, 'Level must use half-level steps.'],
    [{ attack_iv: 16 }, 'Attack IV must be between 0 and 15.'],
    [{ friendship_level: 6 }, 'Friendship must be between 0 and 5.'],
    [{ gender: 'Unknown' }, 'Gender selection is invalid.'],
    [{ pokeball: 'ordinary_ball' }, 'Poké Ball selection is invalid.'],
    [{ lucky: true, is_traded: false }, 'Lucky Pokémon are always traded.'],
    [{ max_attack: 0 }, 'Max Attack must be between 1 and 3.'],
    [{ max_guard: 4 }, 'Max Guard must be between 0 and 3.'],
    [{ max_spirit: 1.5 }, 'Max Spirit must be a whole number.'],
    [{ shadow: true, purified: true }, 'A Pokémon cannot be Shadow and Purified at the same time.'],
  ])('rejects an invalid detail patch %#', async (patch, message) => {
    await expect(persistNativeInstanceDetailMutation({
      userId: 'user-1',
      snapshot,
      requestedInstanceId: 'instance-1',
      patch,
      outbox: makeOutbox(),
      receiverClient: { post: jest.fn() },
      syncBatchId: 'batch-1',
      now: 200,
    })).rejects.toThrow(message);
  });

  it('enforces the canonical Shadow invariants in the persisted mutation', async () => {
    const result = await persistNativeInstanceDetailMutation({
      userId: 'user-1',
      snapshot,
      requestedInstanceId: 'instance-1',
      patch: {
        shadow: true,
        lucky: true,
        is_traded: true,
        purified: false,
      },
      outbox: makeOutbox(),
      receiverClient: { post: jest.fn().mockResolvedValue({ accepted: true }) },
      syncBatchId: 'batch-shadow',
      now: 201,
    });

    expect(result.mutation.updated).toEqual(expect.objectContaining({
      shadow: true,
      purified: false,
      lucky: false,
      is_traded: false,
    }));
  });

  it('normalizes active and inactive Mega form state before persistence', async () => {
    const active = await persistNativeInstanceDetailMutation({
      userId: 'user-1',
      snapshot,
      requestedInstanceId: 'instance-1',
      patch: {
        is_mega: true,
        mega: false,
        mega_form: 'x',
        fusion_form: 'Crowned Sword',
      },
      outbox: makeOutbox(),
      receiverClient: { post: jest.fn().mockResolvedValue({ accepted: true }) },
      syncBatchId: 'batch-mega-active',
      now: 202,
    });
    expect(active.mutation.updated).toEqual(expect.objectContaining({
      is_mega: true,
      mega: true,
      mega_form: 'x',
      fusion_form: 'Crowned Sword',
    }));

    const inactive = await persistNativeInstanceDetailMutation({
      userId: 'user-1',
      snapshot,
      requestedInstanceId: 'instance-1',
      patch: { is_mega: false, mega: true, mega_form: 'x' },
      outbox: makeOutbox(),
      receiverClient: { post: jest.fn().mockResolvedValue({ accepted: true }) },
      syncBatchId: 'batch-mega-inactive',
      now: 203,
    });
    expect(inactive.mutation.updated).toEqual(expect.objectContaining({
      is_mega: false,
      mega: false,
      mega_form: null,
    }));
  });
});
