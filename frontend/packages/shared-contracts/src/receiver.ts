export const receiverContract = {
  endpoints: {
    batchedUpdates: '/batchedUpdates',
  },
} as const;

export interface ReceiverBatchedUpdatesPayload<
  TPokemonUpdate = Record<string, unknown>,
  TTradeUpdate = Record<string, unknown>,
> {
  location: unknown | null;
  pokemonUpdates: TPokemonUpdate[];
  tradeUpdates: TTradeUpdate[];
}
