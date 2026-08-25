import { usersContract } from '@pokemongonexus/shared-contracts/users';
import { getNativeTrainerProfile } from '../../../src/services/socialApi';

const profile = {
  user: { user_id: 'user-1', username: 'AdamZilla', app_joined_at: '2026-01-01' },
  trainer_titles: [],
  stats: { caught: 1, for_trade: 2, wanted: 3, favorites: 4, registered: 5 },
  highlights: [],
  viewer: { relationship: 'self', can_view_profile: true, can_view_collection: true },
};

describe('getNativeTrainerProfile', () => {
  it('uses the own-profile endpoint when no trainer is supplied', async () => {
    const client = { get: jest.fn().mockResolvedValue(profile) };
    await expect(getNativeTrainerProfile(client)).resolves.toEqual(profile);
    expect(client.get).toHaveBeenCalledWith(usersContract.endpoints.profile);
  });

  it('normalizes a foreign trainer and uses the canonical endpoint', async () => {
    const client = { get: jest.fn().mockResolvedValue(profile) };
    await getNativeTrainerProfile(client, ' AdamZilla ');
    expect(client.get).toHaveBeenCalledWith(usersContract.endpoints.profileByUsername('AdamZilla'));
  });

  it('rejects a malformed profile rather than rendering invented state', async () => {
    const client = { get: jest.fn().mockResolvedValue({ user: { username: 'Broken' } }) };
    await expect(getNativeTrainerProfile(client)).rejects.toThrow('invalid');
  });
});
