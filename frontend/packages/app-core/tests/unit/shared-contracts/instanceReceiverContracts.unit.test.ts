import { describe, expect, it } from 'vitest';
import type { PokemonInstance } from '@shared-contracts/instances';
import type {
  ReceiverBatchedUpdatesPayload,
  ReceiverPokemonUpdate,
} from '@shared-contracts/receiver';

type ReceiverPokemonVariantId = ReceiverPokemonUpdate['variant_id'];
const receiverVariantIdRejectsNull: null extends ReceiverPokemonVariantId ? never : true = true;

const backendInstance = {
  instance_id: 'inst-1',
  variant_id: '0025-default',
  user_id: 'user-1',
  pokemon_id: 25,
  nickname: null,
  cp: null,
  level: null,
  attack_iv: null,
  defense_iv: null,
  stamina_iv: null,
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
  dynamax: true,
  gigantamax: false,
  crown: false,
  max_attack: '3',
  max_guard: '2',
  max_spirit: '0',
  is_fused: false,
  fusion: {},
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
  not_trade_list: {},
  not_wanted_list: {},
  trade_filters: {},
  wanted_filters: {},
  mirror: false,
  pref_lucky: false,
  friendship_level: null,
  registered: true,
  favorite: false,
  disabled: false,
  trace_id: 'trace-1',
  pokeball: null,
  location_card: null,
  location_caught: null,
  date_caught: null,
  date_added: '2026-05-05T00:00:00.000Z',
  last_update: 1_778_000_000_000,
  gps: null,
} satisfies PokemonInstance;

describe('instance and receiver shared contracts', () => {
  it('accepts backend-shaped persisted instance rows from users/search/storage services', () => {
    expect(backendInstance.variant_id).toBe('0025-default');
    expect(backendInstance.max_attack).toBe('3');
    expect(backendInstance.friendship_level).toBeNull();
  });

  it('types receiver pokemon updates as patch payloads with the instance_id transport field', () => {
    const update = {
      instance_id: 'inst-1',
      pokemon_id: 25,
      is_caught: true,
      max_attack: '3',
      friendship_level: 4,
      last_update: 1_778_000_000_000,
    } satisfies ReceiverPokemonUpdate;

    const payload = {
      sync_batch_id: 'batch-1',
      location: null,
      pokemonUpdates: [update],
    } satisfies ReceiverBatchedUpdatesPayload;

    expect(receiverVariantIdRejectsNull).toBe(true);
    expect(payload.pokemonUpdates[0].instance_id).toBe('inst-1');
    expect(payload.pokemonUpdates[0].max_attack).toBe('3');
  });
});
