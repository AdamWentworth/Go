import type { TradeRecord } from '@shared-contracts/trades';

export interface TradeViewTrade {
  trade_status?: TradeRecord['trade_status'] | null;
  trade_friendship_level?: TradeRecord['trade_friendship_level'];
  trade_dust_cost?: TradeRecord['trade_dust_cost'];
  is_lucky_trade?: boolean | number | null;
  username_proposed?: TradeRecord['username_proposed'];
  username_accepting?: TradeRecord['username_accepting'];
  user_proposed_completion_confirmed?: TradeRecord['user_proposed_completion_confirmed'];
  user_accepting_completion_confirmed?: TradeRecord['user_accepting_completion_confirmed'];
  user_1_trade_satisfaction?: boolean | number | null;
  user_2_trade_satisfaction?: boolean | number | null;
  trade_cancelled_date?: TradeRecord['trade_cancelled_date'];
  trade_cancelled_by?: TradeRecord['trade_cancelled_by'];
  trade_completed_date?: TradeRecord['trade_completed_date'];
  [key: string]: unknown;
}

export interface TradeMove {
  move_id: number;
  name: string;
  type: string;
  type_name: string;
  legacy?: boolean;
}

export interface TradePokemonDetails {
  name?: string | null;
  pokemon_name?: string | null;
  pokemon_id?: number | null;
  currentImage?: string | null;
  pokemon_image_url?: string | null;
  variantType?: string | string[] | null;
  type_1_icon?: string | null;
  type_2_icon?: string | null;
  gender?: 'Male' | 'Female' | 'Both' | 'Any' | 'Genderless' | null;
  fast_move_id?: number | null;
  charged_move1_id?: number | null;
  charged_move2_id?: number | null;
  moves?: unknown[] | null;
  attack_iv?: number | null;
  defense_iv?: number | null;
  stamina_iv?: number | null;
  weight?: number | null;
  height?: number | null;
  location_caught?: string | null;
  date_caught?: string | null;
}
