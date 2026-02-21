import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import {
  mutateInstanceStatus,
  type InstanceStatusMutation,
} from './instanceMutations';

const toSafeFormSlug = (form: string | null | undefined): string | null => {
  if (!form) return null;
  const trimmed = form.trim();
  if (!trimmed || trimmed.toLowerCase() === 'normal') return null;
  return trimmed.toLowerCase().replace(/\s+/g, '_');
};

export const toDefaultVariantId = (pokemonId: number, form: string | null | undefined): string => {
  const padded = String(pokemonId).padStart(4, '0');
  const formSlug = toSafeFormSlug(form);
  return formSlug ? `${padded}-${formSlug}_default` : `${padded}-default`;
};

export const generateInstanceId = (): string =>
  `mobile_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const createBaseInstance = (
  pokemon: BasePokemon,
  variantId: string,
  instanceId: string,
): PokemonInstance => ({
  instance_id: instanceId,
  variant_id: variantId,
  pokemon_id: pokemon.pokemon_id,
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
  dynamax: false,
  gigantamax: false,
  crown: false,
  max_attack: null,
  max_guard: null,
  max_spirit: null,
  is_fused: false,
  fusion: null,
  fusion_form: null,
  fused_with: null,
  is_traded: false,
  traded_date: null,
  original_trainer_id: null,
  original_trainer_name: null,
  is_caught: false,
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
  registered: false,
  favorite: false,
  disabled: false,
  pokeball: null,
  location_card: null,
  location_caught: null,
  date_caught: null,
  date_added: new Date().toISOString(),
  last_update: Date.now(),
});

export const createInstanceFromPokemon = (
  pokemon: BasePokemon,
  targetStatus: InstanceStatusMutation,
): PokemonInstance => {
  const instanceId = generateInstanceId();
  const variantId = toDefaultVariantId(pokemon.pokemon_id, pokemon.form);
  const base = createBaseInstance(pokemon, variantId, instanceId);
  return mutateInstanceStatus(base, targetStatus);
};

