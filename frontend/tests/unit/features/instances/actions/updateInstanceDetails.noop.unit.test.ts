import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateInstanceDetails } from '@/features/instances/actions/updateInstanceDetails';

const mocks = vi.hoisted(() => ({
  putInstancesBulk: vi.fn(),
  putBatchedPokemonUpdates: vi.fn(),
}));

vi.mock('@/db/indexedDB', () => ({
  putInstancesBulk: mocks.putInstancesBulk,
  putBatchedPokemonUpdates: mocks.putBatchedPokemonUpdates,
}));

describe('updateInstanceDetails no-op behavior', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1234);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => undefined);

    vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as typeof requestAnimationFrame);

    mocks.putInstancesBulk.mockResolvedValue(undefined);
    mocks.putBatchedPokemonUpdates.mockResolvedValue(undefined);
  });

  it('skips state/cache writes when patch has no effective field change', async () => {
    const data = {
      instances: {
        a: {
          instance_id: 'a',
          nickname: 'Pika',
          cp: 500,
          last_update: 1000,
        },
      },
    } as any;

    const setData = vi.fn();
    const updater = updateInstanceDetails(data, setData as any);

    await updater('a', { nickname: 'Pika', cp: 500 });

    expect(setData).not.toHaveBeenCalled();
    expect(mocks.putInstancesBulk).not.toHaveBeenCalled();
    expect(mocks.putBatchedPokemonUpdates).not.toHaveBeenCalled();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('writes when at least one patch field changes', async () => {
    const data = {
      instances: {
        a: {
          instance_id: 'a',
          nickname: 'Pika',
          cp: 500,
          last_update: 1000,
        },
      },
    } as any;

    let updated: any = null;
    const setData = vi.fn((updater: (prev: any) => any) => {
      updated = updater({ instances: { ...data.instances } });
      return updated;
    });

    const updater = updateInstanceDetails(data, setData as any);
    await updater('a', { cp: 777 });

    expect(setData).toHaveBeenCalledTimes(1);
    expect(updated.instances.a.cp).toBe(777);
    expect(updated.instances.a.last_update).toBe(1234);
    expect(mocks.putInstancesBulk).toHaveBeenCalledTimes(1);
    expect(mocks.putBatchedPokemonUpdates).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith('ownershipTimestamp', '1234');
  });
});
