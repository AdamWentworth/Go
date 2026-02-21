import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';
import type { PokemonSearchQueryParams } from '@pokemongonexus/shared-contracts/search';

export type BooleanFilter = 'any' | 'true' | 'false';

export type SearchFormState = {
  pokemonIdInput: string;
  latitudeInput: string;
  longitudeInput: string;
  rangeInput: string;
  limitInput: string;
  ownershipMode: OwnershipMode;
  shinyInput: BooleanFilter;
  shadowInput: BooleanFilter;
  dynamaxInput: BooleanFilter;
  gigantamaxInput: BooleanFilter;
  costumeIdInput: string;
  fastMoveIdInput: string;
  chargedMove1Input: string;
  chargedMove2Input: string;
  genderInput: string;
  backgroundIdInput: string;
  attackIvInput: string;
  defenseIvInput: string;
  staminaIvInput: string;
  onlyMatchingTradesInput: BooleanFilter;
  prefLuckyInput: BooleanFilter;
  alreadyRegisteredInput: BooleanFilter;
  tradeInWantedListInput: BooleanFilter;
  friendshipLevelInput: string;
};

export const defaultSearchFormState: SearchFormState = {
  pokemonIdInput: '1',
  latitudeInput: '0',
  longitudeInput: '0',
  rangeInput: '100',
  limitInput: '50',
  ownershipMode: 'caught',
  shinyInput: 'false',
  shadowInput: 'false',
  dynamaxInput: 'false',
  gigantamaxInput: 'false',
  costumeIdInput: '',
  fastMoveIdInput: '',
  chargedMove1Input: '',
  chargedMove2Input: '',
  genderInput: '',
  backgroundIdInput: '',
  attackIvInput: '',
  defenseIvInput: '',
  staminaIvInput: '',
  onlyMatchingTradesInput: 'any',
  prefLuckyInput: 'any',
  alreadyRegisteredInput: 'any',
  tradeInWantedListInput: 'any',
  friendshipLevelInput: '',
};

const toNumberWithFallback = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNullableBoolean = (value: BooleanFilter): boolean | null => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

export const buildPokemonSearchQuery = (
  formState: SearchFormState,
): PokemonSearchQueryParams => ({
  pokemon_id: toNumberWithFallback(formState.pokemonIdInput, 1),
  shiny: formState.shinyInput === 'true',
  shadow: formState.shadowInput === 'true',
  costume_id: toNullableNumber(formState.costumeIdInput),
  fast_move_id: toNullableNumber(formState.fastMoveIdInput),
  charged_move_1_id: toNullableNumber(formState.chargedMove1Input),
  charged_move_2_id: toNullableNumber(formState.chargedMove2Input),
  gender: formState.genderInput.trim() || null,
  background_id: toNullableNumber(formState.backgroundIdInput),
  attack_iv: toNullableNumber(formState.attackIvInput),
  defense_iv: toNullableNumber(formState.defenseIvInput),
  stamina_iv: toNullableNumber(formState.staminaIvInput),
  only_matching_trades: toNullableBoolean(formState.onlyMatchingTradesInput),
  pref_lucky: toNullableBoolean(formState.prefLuckyInput),
  friendship_level: toNullableNumber(formState.friendshipLevelInput),
  already_registered: toNullableBoolean(formState.alreadyRegisteredInput),
  trade_in_wanted_list: toNullableBoolean(formState.tradeInWantedListInput),
  latitude: toNumberWithFallback(formState.latitudeInput, 0),
  longitude: toNumberWithFallback(formState.longitudeInput, 0),
  ownership: formState.ownershipMode,
  range_km: toNumberWithFallback(formState.rangeInput, 100),
  limit: toNumberWithFallback(formState.limitInput, 50),
  dynamax: formState.dynamaxInput === 'true',
  gigantamax: formState.gigantamaxInput === 'true',
});

