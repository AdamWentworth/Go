import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import { calculateTradeCost } from '@pokemongonexus/shared-domain/trade-cost';
import {
  prepareTradeCandidateSets,
  resolveTradeCandidateDecision,
} from '@pokemongonexus/shared-domain/trade-proposal-candidates';

const UUID_SUFFIX = /_[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const parseVariantId = (input: string) => ({
  baseKey: input.replace(UUID_SUFFIX, ''),
});

const instance = (
  overrides: Partial<PokemonInstance> = {},
): PokemonInstance => ({
  instance_id: 'mine-1',
  variant_id: '0006-default',
  pokemon_id: 6,
  is_caught: true,
  is_for_trade: true,
  lucky: false,
  ...overrides,
} as PokemonInstance);

describe('shared native trade domain', () => {
  it('uses the same candidate lockouts as the canonical web proposal flow', () => {
    const lucky = instance({ instance_id: 'lucky-1', lucky: true, is_for_trade: false });
    const sets = prepareTradeCandidateSets(
      { variant_id: '0006-default' },
      [lucky],
      parseVariantId,
    );

    expect(resolveTradeCandidateDecision(
      { variant_id: '0006-default' },
      sets.selectedBaseKey,
      sets.caughtInstances,
      sets.tradeableInstances,
      [],
    )).toEqual({ kind: 'onlyTradeLocked' });
  });

  it('excludes a For Trade copy already committed to a proposal', () => {
    const offered = instance();
    const sets = prepareTradeCandidateSets(
      { variant_id: '0006-default' },
      [offered],
      parseVariantId,
    );

    expect(resolveTradeCandidateDecision(
      { variant_id: '0006-default' },
      sets.selectedBaseKey,
      sets.caughtInstances,
      sets.tradeableInstances,
      [{
        trade_status: 'proposed',
        pokemon_instance_id_user_proposed: offered.instance_id,
      }],
    )).toEqual({ kind: 'noAvailableTradeable' });
  });

  it('uses Best Friends pricing at five hearts while remote remains independent', () => {
    const result = calculateTradeCost({
      friendshipLevel: 5,
      receivedPokemon: {
        variant_id: '0150-default',
        rarity: 'Legendary',
      },
      offeredInstance: instance({ shiny: false }),
      currentTrainerInstances: {},
      partnerInstances: {},
      parseVariantId,
    });

    expect(result).toEqual({
      stardustCost: 40_000,
      isSpecialTrade: true,
      isRegisteredTrade: false,
    });
  });
});
