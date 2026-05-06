import type { PokemonInstance } from './instances';
import type { TradeRecord } from './trades';

export const receiverContract = {
  endpoints: {
    batchedUpdates: '/batchedUpdates',
  },
} as const;

export type ReceiverPokemonUpdate = Omit<Partial<PokemonInstance>, 'variant_id'> & {
  instance_id: string;
  variant_id?: string;
};

export type ReceiverTradeUpdate = Partial<TradeRecord> & {
  trade_id: string;
  operation?: string;
  tradeData?: TradeRecord;
};

export interface ReceiverBatchedUpdatesPayload<
  TPokemonUpdate = ReceiverPokemonUpdate,
  TTradeUpdate = ReceiverTradeUpdate,
> {
  location: unknown | null;
  pokemonUpdates: TPokemonUpdate[];
  tradeUpdates: TTradeUpdate[];
}
