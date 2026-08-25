import type { AuthoritativeTradeProposalRequest } from '@pokemongonexus/shared-contracts/trades';
import { tradesContract } from '@pokemongonexus/shared-contracts/trades';
import {
  createNativeTradeProposal,
  getNativeTrades,
} from '../../../src/services/tradeApi';

const proposal: AuthoritativeTradeProposalRequest = {
  username_accepting: 'OtherTrainer',
  pokemon_instance_id_user_proposed: 'mine-1',
  pokemon_instance_id_user_accepting: 'theirs-1',
  is_special_trade: true,
  is_registered_trade: false,
  is_lucky_trade: false,
  trade_dust_cost: 40_000,
  trade_friendship_level: 5,
};

describe('native trade API', () => {
  it('loads the signed-in trainer’s canonical trades', async () => {
    const envelope = {
      trades: [{ trade_id: 'trade-1', trade_status: 'proposed' }],
      related_instances: {},
    };
    const usersClient = { get: jest.fn().mockResolvedValue(envelope) };

    await expect(getNativeTrades(usersClient)).resolves.toEqual(envelope);
    expect(usersClient.get).toHaveBeenCalledWith(tradesContract.endpoints.list);
  });

  it('submits only the authoritative proposal command payload', async () => {
    const envelope = {
      trade: { trade_id: 'trade-1', trade_status: 'proposed' },
      affected_instances: {
        'mine-1': { instance_id: 'mine-1', is_for_trade: true },
      },
    };
    const usersClient = { post: jest.fn().mockResolvedValue(envelope) };

    await expect(
      createNativeTradeProposal(usersClient, proposal),
    ).resolves.toEqual(envelope);
    expect(usersClient.post).toHaveBeenCalledWith(
      tradesContract.endpoints.create,
      proposal,
    );
    expect(usersClient.post.mock.calls[0]?.[1]).not.toHaveProperty(
      'username_proposed',
    );
    expect(usersClient.post.mock.calls[0]?.[1]).not.toHaveProperty(
      'trade_status',
    );
  });

  it('rejects malformed trade lists instead of treating them as empty', async () => {
    const usersClient = {
      get: jest.fn().mockResolvedValue({ trades: {}, related_instances: {} }),
    };

    await expect(getNativeTrades(usersClient)).rejects.toThrow(
      'trades response is invalid',
    );
  });

  it('rejects proposal responses without a committed trade id', async () => {
    const usersClient = {
      post: jest.fn().mockResolvedValue({
        trade: { trade_status: 'proposed' },
        affected_instances: {},
      }),
    };

    await expect(
      createNativeTradeProposal(usersClient, proposal),
    ).rejects.toThrow('proposal response is invalid');
  });
});
