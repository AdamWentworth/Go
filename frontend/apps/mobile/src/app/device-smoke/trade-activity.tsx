import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { TradeRecord } from '@pokemongonexus/shared-contracts/trades';
import type { NativeInstanceDetail } from '../../features/collection/collectionModel';
import { buildNativeTradeActivityModel } from '../../features/trades/nativeTradeActivityModel';
import {
  NativeTradeActivityScreen,
  type NativeTradeActivityRow,
} from '../../screens/NativeTradeActivityScreen';
import { runtimeConfig } from '../../config/runtimeConfig';

const ASSET_BASE_URL = 'https://pokegonexus.com';

const imagePaths: Record<string, string> = {
  'mine-incoming': '/images/gigantamax/gigantamax_6.png',
  'theirs-incoming': '/images/shiny/shiny_pokemon_150.png',
  'mine-sent': '/images/shiny/shiny_pokemon_483.png',
  'theirs-sent': '/images/shiny/shiny_pokemon_223.png',
  'mine-active': '/images/shiny/shiny_pokemon_1.png',
  'theirs-active': '/images/shiny/shiny_pokemon_7.png',
  'mine-completed': '/images/shiny/shiny_pokemon_250.png',
  'theirs-completed': '/images/shiny/shiny_pokemon_245.png',
  'mine-closed': '/images/shiny/shiny_pokemon_376.png',
  'theirs-closed': '/images/shiny/shiny_pokemon_248.png',
};

const names: Record<string, string> = {
  'mine-incoming': 'Gigantamax Charizard',
  'theirs-incoming': 'Shiny Mewtwo',
  'mine-sent': 'Shiny Dialga',
  'theirs-sent': 'Shiny Remoraid',
  'mine-active': 'Shiny Bulbasaur',
  'theirs-active': 'Shiny Squirtle',
  'mine-completed': 'Shiny Ho-Oh',
  'theirs-completed': 'Shiny Suicune',
  'mine-closed': 'Shiny Metagross',
  'theirs-closed': 'Shiny Tyranitar',
};

const detail = (id: string): NativeInstanceDetail => ({
  instance: {
    instance_id: id,
    variant_id: id,
    pokemon_id: 1,
    is_caught: true,
    is_for_trade: true,
  } as PokemonInstance,
  row: {
    id,
    pokemonId: 1,
    pokedexNumber: 1,
    name: names[id],
    imageUri: `${ASSET_BASE_URL}${imagePaths[id]}`,
    locationBackgroundUri: null,
    maxKind: id === 'mine-incoming' ? 'gigantamax' : null,
    purified: false,
    lucky: false,
    typeIconUris: [],
    status: 'trade',
    source: 'instance',
    cp: null,
    favorite: false,
    mostWanted: false,
  },
  traits: [],
  stats: [],
  ivs: [],
  moves: [],
  provenance: [],
  preferences: [],
});

const initialTrades: TradeRecord[] = [
  {
    trade_id: 'incoming',
    trade_status: 'proposed',
    username_proposed: 'OtherTrainer',
    username_accepting: 'AdamZilla',
    pokemon_instance_id_user_proposed: 'theirs-incoming',
    pokemon_instance_id_user_accepting: 'mine-incoming',
    trade_friendship_level: 'Forever',
    trade_dust_cost: 40_000,
    is_lucky_trade: false,
    trade_proposal_date: '2026-08-24T10:00:00.000Z',
  },
  {
    trade_id: 'sent',
    trade_status: 'proposed',
    username_proposed: 'AdamZilla',
    username_accepting: 'OtherTrainer',
    pokemon_instance_id_user_proposed: 'mine-sent',
    pokemon_instance_id_user_accepting: 'theirs-sent',
    trade_friendship_level: 'Best',
    trade_dust_cost: 800,
    is_lucky_trade: true,
    trade_proposal_date: '2026-08-23T10:00:00.000Z',
  },
  {
    trade_id: 'active',
    trade_status: 'pending',
    username_proposed: 'AdamZilla',
    username_accepting: 'OtherTrainer',
    pokemon_instance_id_user_proposed: 'mine-active',
    pokemon_instance_id_user_accepting: 'theirs-active',
    trade_friendship_level: 'Forever',
    trade_dust_cost: 20_000,
    is_lucky_trade: true,
    trade_proposal_date: '2026-08-22T10:00:00.000Z',
    trade_accepted_date: '2026-08-22T12:00:00.000Z',
  },
  {
    trade_id: 'completed',
    trade_status: 'completed',
    username_proposed: 'OtherTrainer',
    username_accepting: 'AdamZilla',
    pokemon_instance_id_user_proposed: 'theirs-completed',
    pokemon_instance_id_user_accepting: 'mine-completed',
    trade_friendship_level: 'Ultra',
    trade_dust_cost: 1_600,
    is_lucky_trade: false,
    trade_completed_date: '2026-08-21T10:00:00.000Z',
  },
  {
    trade_id: 'closed',
    trade_status: 'cancelled',
    username_proposed: 'AdamZilla',
    username_accepting: 'OtherTrainer',
    pokemon_instance_id_user_proposed: 'mine-closed',
    pokemon_instance_id_user_accepting: 'theirs-closed',
    trade_friendship_level: 'Good',
    trade_dust_cost: 1_000_000,
    is_lucky_trade: false,
    trade_cancelled_date: '2026-08-20T10:00:00.000Z',
  },
];

export default function DeviceSmokeTradeActivityRoute() {
  const [trades, setTrades] = useState(initialTrades);
  const rows = useMemo(() => trades.flatMap<NativeTradeActivityRow>((trade) => {
    const model = buildNativeTradeActivityModel(trade, 'AdamZilla');
    if (!model) return [];
    return [{
      model,
      currentUserPokemon: detail(model.currentUserInstanceId),
      partnerPokemon: detail(model.partnerInstanceId),
    }];
  }), [trades]);

  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;

  return (
    <NativeTradeActivityScreen
      assetBaseUrl={ASSET_BASE_URL}
      error={null}
      isLoading={false}
      onAction={async (model, action) => {
        setTrades((current) => current.flatMap((trade) => {
          if (trade.trade_id !== model.tradeId) return [trade];
          if (action === 'delete') return [];
          if (action === 'cancel') return [{ ...trade, trade_status: 'cancelled' }];
          if (action === 'accept') return [{ ...trade, trade_status: 'pending' }];
          if (action === 'deny') return [{ ...trade, trade_status: 'denied' }];
          if (action === 'repropose') return [{ ...trade, trade_status: 'proposed' }];
          if (action === 'complete') return [{
            ...trade,
            user_proposed_completion_confirmed: model.participantRole === 'proposer'
              ? true
              : trade.user_proposed_completion_confirmed,
            user_accepting_completion_confirmed: model.participantRole === 'accepter'
              ? true
              : trade.user_accepting_completion_confirmed,
          }];
          if (action === 'satisfy') return [{
            ...trade,
            user_1_trade_satisfaction: model.participantRole === 'proposer'
              ? true
              : trade.user_1_trade_satisfaction,
            user_2_trade_satisfaction: model.participantRole === 'accepter'
              ? true
              : trade.user_2_trade_satisfaction,
          }];
          return [trade];
        }));
      }}
      onOpenPreferences={() => undefined}
      onRetry={() => undefined}
      onRevealPartner={async () => ({
        sharingEnabled: true,
        trainerCode: '1234 5678 9012',
        pokemonGoName: 'OtherPogoName',
        coordinationMethod: 'campfire',
        coordinationHandle: 'OtherTrainer',
        location: 'Burnaby, British Columbia, Canada',
      })}
      rows={rows}
    />
  );
}
