import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pending: vi.fn(),
  acknowledged: vi.fn(),
  deleteAcknowledged: vi.fn(),
  replaceInstances: vi.fn(),
  request: vi.fn(),
  parse: vi.fn(),
  checkpoint: '',
  setCheckpoint: vi.fn(),
}));

vi.mock('@/db/indexedDB', () => ({
  getBatchedPokemonUpdates: mocks.pending,
  getAcknowledgedPokemonUpdates: mocks.acknowledged,
  deleteAcknowledgedPokemonUpdates: mocks.deleteAcknowledged,
}));
vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: {
    getState: () => ({ replaceInstances: mocks.replaceInstances }),
  },
}));
vi.mock('@/services/httpClient', () => ({
  buildUrl: (_base: string, path: string, query?: Record<string, string>) =>
    `${path}?checkpoint=${query?.checkpoint ?? ''}`,
  requestWithPolicy: mocks.request,
  parseJsonSafe: mocks.parse,
  toHttpError: () => new Error('request failed'),
}));
vi.mock('@/utils/storage', () => ({
  STORAGE_KEYS: { ownershipCheckpoint: 'ownershipCheckpoint' },
  getStorageString: () => mocks.checkpoint,
  setStorageString: mocks.setCheckpoint,
}));

import { reconcileInstancesFromServer } from '@/features/instances/services/reconcileInstances';

describe('reconcileInstancesFromServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkpoint = 'old-checkpoint';
    mocks.request.mockResolvedValue({ ok: true, status: 200 });
    mocks.acknowledged.mockResolvedValue([]);
  });

  it('keeps accepted mutations overlaid until a server snapshot confirms them', async () => {
    mocks.parse.mockResolvedValue({
      checkpoint: 'new-checkpoint',
      not_modified: false,
      instances: {
        waiting: { instance_id: 'waiting', pokemon_id: 4, last_update: 10 },
        confirmed: { instance_id: 'confirmed', pokemon_id: 5, last_update: 40 },
      },
    });
    mocks.pending.mockResolvedValue([]);
    mocks.acknowledged.mockResolvedValue([
      { instance_id: 'waiting', pokemon_id: 4, last_update: 30, is_caught: true },
      { instance_id: 'confirmed', pokemon_id: 5, last_update: 30, is_caught: true },
    ]);

    await reconcileInstancesFromServer();

    expect(mocks.deleteAcknowledged).toHaveBeenCalledWith(['confirmed']);
    expect(mocks.replaceInstances).toHaveBeenCalledWith({
      waiting: expect.objectContaining({ last_update: 30 }),
      confirmed: expect.objectContaining({ last_update: 40 }),
    });
  });

  it('replaces a changed snapshot while preserving newer pending local edits and deletions', async () => {
    mocks.parse.mockResolvedValue({
      checkpoint: 'new-checkpoint',
      not_modified: false,
      instances: {
        edited: { instance_id: 'edited', pokemon_id: 1, last_update: 10 },
        deleted: { instance_id: 'deleted', pokemon_id: 2, last_update: 10 },
        canonical: { instance_id: 'canonical', pokemon_id: 3, last_update: 20 },
      },
    });
    mocks.pending.mockResolvedValue([
      {
        instance_id: 'edited',
        pokemon_id: 1,
        last_update: 30,
        is_caught: true,
      },
      {
        instance_id: 'deleted',
        pokemon_id: 2,
        last_update: 31,
        is_caught: false,
        is_for_trade: false,
        is_wanted: false,
      },
    ]);

    await expect(reconcileInstancesFromServer()).resolves.toBe(true);
    expect(mocks.setCheckpoint).toHaveBeenCalledWith(
      'ownershipCheckpoint',
      'new-checkpoint',
    );
    expect(mocks.replaceInstances).toHaveBeenCalledWith({
      edited: expect.objectContaining({ last_update: 30, is_caught: true }),
      canonical: expect.objectContaining({ last_update: 20 }),
    });
  });

  it('does not rewrite IndexedDB when the server checkpoint still matches', async () => {
    mocks.parse.mockResolvedValue({
      checkpoint: 'old-checkpoint',
      not_modified: true,
    });

    await expect(reconcileInstancesFromServer()).resolves.toBe(false);
    expect(mocks.pending).not.toHaveBeenCalled();
    expect(mocks.replaceInstances).not.toHaveBeenCalled();
  });
});
