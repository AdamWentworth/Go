// trades.ts

/* -------------------------------------------------------------------------- */
/*  Trade objects (map values under .trades)                                  */
/* -------------------------------------------------------------------------- */

export interface Trade {
  /** key (`trade_id`) is already used as the map-key, so optional here */
  trade_id?: string;

  is_special_trade: boolean;
  is_registered_trade: boolean;
  is_lucky_trade: boolean;

  trade_status: string;                        // “Proposed” | “Accepted” | …
  pokemon_instance_id_user_proposed: string | null;
  pokemon_instance_id_user_accepting: string | null;

  trade_proposal_date: string;                // ISO 8601
  trade_accepted_date: string | null;
  trade_completed_date: string | null;
  trade_cancelled_date: string | null;
  trade_cancelled_by: string | null;

  trade_dust_cost: number | null;
  trade_friendship_level: number | null;

  user_1_trade_satisfaction: number | null;
  user_2_trade_satisfaction: number | null;

  /** null in the backend when never updated */
  last_update?: string | null;
}
