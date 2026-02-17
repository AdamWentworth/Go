import type { PokemonInstance } from '@/types/pokemonInstance';

export type TradeMoves = {
  fastMove: number | null;
  chargedMove1: number | null;
  chargedMove2: number | null;
};

export type TradeIvs = {
  Attack: number | '' | null;
  Defense: number | '' | null;
  Stamina: number | '' | null;
};

type TradeComputedValues = {
  level?: number | null;
  cp?: number | null;
  ivs?: TradeIvs;
};

type TradeValidationInput = {
  level: number | null;
  cp: string;
  ivs: TradeIvs;
  weight: number | '';
  height: number | '';
};

type BuildTradePatchInput = TradeValidationInput & {
  nickname: string | null;
  gender: string | null;
  moves: TradeMoves;
  locationCaught: string | null;
  dateCaught: string | null;
  selectedBackgroundId: number | null;
  maxAttack: string;
  maxGuard: string;
  maxSpirit: string;
  computedValues?: TradeComputedValues;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  const parsed = toNullableNumber(value);
  return parsed === null ? undefined : parsed;
};

export const areTradeIvsEmpty = (ivs: TradeIvs): boolean =>
  (ivs.Attack === '' || ivs.Attack === null) &&
  (ivs.Defense === '' || ivs.Defense === null) &&
  (ivs.Stamina === '' || ivs.Stamina === null);

export const toTradeValidationFields = (input: TradeValidationInput) => ({
  level: toOptionalNumber(input.level),
  cp: toOptionalNumber(input.cp),
  ivs: {
    Attack: toOptionalNumber(input.ivs.Attack),
    Defense: toOptionalNumber(input.ivs.Defense),
    Stamina: toOptionalNumber(input.ivs.Stamina),
  },
  weight: input.weight,
  height: input.height,
});

export const buildTradeInstancePatch = (
  input: BuildTradePatchInput,
): Partial<PokemonInstance> => {
  const computedIvs = input.computedValues?.ivs ?? input.ivs;

  return {
    nickname: input.nickname,
    cp: toNullableNumber(input.computedValues?.cp ?? input.cp),
    gender: input.gender,
    weight: toNullableNumber(input.weight),
    height: toNullableNumber(input.height),
    fast_move_id: input.moves.fastMove,
    charged_move1_id: input.moves.chargedMove1,
    charged_move2_id: input.moves.chargedMove2,
    level: input.computedValues?.level ?? input.level,
    attack_iv: toNullableNumber(computedIvs.Attack),
    defense_iv: toNullableNumber(computedIvs.Defense),
    stamina_iv: toNullableNumber(computedIvs.Stamina),
    location_caught: input.locationCaught,
    date_caught: input.dateCaught,
    location_card:
      input.selectedBackgroundId == null ? null : String(input.selectedBackgroundId),
    max_attack: toNullableNumber(input.maxAttack),
    max_guard: toNullableNumber(input.maxGuard),
    max_spirit: toNullableNumber(input.maxSpirit),
  };
};

