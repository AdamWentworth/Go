import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updateInstanceStatus } from '@/features/instances/actions/updateInstanceStatus';
import * as db from '@/db/indexedDB';
import type { Instances } from '@/types/instances';

const TS = 1_700_000_000_000;
const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

const VARIANT = {
  variant_id: '0001-default',
  pokemon_id: 1,
  variantType: 'default',
  currentImage: '',
  species_name: 'Bulbasaur',
} as any;

function makeInstance(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    is_caught: false,
    is_for_trade: false,
    is_wanted: false,
    registered: false,
    lucky: false,
    shadow: false,
    mega: false,
    is_mega: false,
    fusion: {},
    last_update: 0,
    ...overrides,
  } as any;
}

function createHarness(initial: Instances) {
  const data = {
    variants: [VARIANT],
    instances: { ...initial },
  };

  let latest = data.instances;
  const ref = { current: latest };

  const setData = vi.fn((updater: any) => {
    const next = updater({ variants: data.variants, instances: latest });
    latest = next.instances;
    data.instances = latest;
    ref.current = latest;
    return next;
  });

  const updater = updateInstanceStatus(data as any, setData as any, ref as any);

  return {
    updater,
    setData,
    getInstances: () => latest,
  };
}

describe('updateInstanceStatus', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(Date, 'now').mockReturnValue(TS);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });

    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(db, 'putInstancesBulk').mockResolvedValue(undefined);
    vi.spyOn(db, 'putBatchedPokemonUpdates').mockResolvedValue(undefined);
  });

  it('updates a single UUID instance and persists updates', async () => {
    const { updater, getInstances } = createHarness({
      [UUID_A]: makeInstance(),
    });

    await updater(UUID_A, 'Caught');

    const out = getInstances();
    expect(out[UUID_A]).toMatchObject({
      is_caught: true,
      is_for_trade: false,
      is_wanted: false,
      registered: true,
    });

    expect(db.putInstancesBulk).toHaveBeenCalled();
    const bulkItems = (db.putInstancesBulk as any).mock.calls.flatMap((c: any[]) => c[0] ?? []);
    expect(bulkItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instance_id: UUID_A,
          is_caught: true,
          last_update: TS,
        }),
      ]),
    );

    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith(
      UUID_A,
      expect.objectContaining({ is_caught: true, last_update: TS }),
    );
    expect(setItemSpy).toHaveBeenCalledWith('ownershipTimestamp', String(TS));
  });

  it('updates multiple UUID instances to Trade in one call', async () => {
    const { updater, getInstances } = createHarness({
      [UUID_A]: makeInstance(),
      [UUID_B]: makeInstance(),
    });

    await updater([UUID_A, UUID_B], 'Trade');

    const out = getInstances();
    expect(out[UUID_A]).toMatchObject({ is_caught: true, is_for_trade: true, is_wanted: false });
    expect(out[UUID_B]).toMatchObject({ is_caught: true, is_for_trade: true, is_wanted: false });

    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith(
      UUID_A,
      expect.objectContaining({ is_for_trade: true }),
    );
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith(
      UUID_B,
      expect.objectContaining({ is_for_trade: true }),
    );
    expect(db.putInstancesBulk).toHaveBeenCalled();
  });

  it('creates a new instance when called with a variant_id target', async () => {
    const { updater, getInstances } = createHarness({});

    await updater('0001-default', 'Wanted');

    const out = getInstances();
    const keys = Object.keys(out);
    expect(keys).toHaveLength(1);

    const created = out[keys[0]] as any;
    expect(created).toMatchObject({
      variant_id: '0001-default',
      is_caught: false,
      is_for_trade: false,
      is_wanted: true,
      registered: true,
    });

    const createdId = keys[0];
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith(
      createdId,
      expect.objectContaining({ is_wanted: true }),
    );
    expect(db.putInstancesBulk).toHaveBeenCalled();
  });

  it('logs updatesDB errors but does not throw', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (db.putBatchedPokemonUpdates as any).mockRejectedValueOnce(new Error('updates down'));

    const { updater } = createHarness({
      [UUID_A]: makeInstance(),
    });

    await expect(updater(UUID_A, 'Caught')).resolves.toBeUndefined();
    expect(errSpy).toHaveBeenCalledWith(
      '[updateInstanceStatus] updatesDB write failed:',
      expect.any(Error),
    );
  });
});
