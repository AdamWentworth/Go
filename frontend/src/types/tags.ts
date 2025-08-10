// tags.ts

/* -------------------------------------------------------------------------- */
/*  Tag‑bucket types (identical structure to Lists)                           */
/* -------------------------------------------------------------------------- */

import type { Costume, Move } from './pokemonSubTypes';

/* one row in any bucket */
export interface TagItem {
  currentImage : string;
  friendship_level : number | null;
  mirror       : boolean;
  pref_lucky   : boolean;
  pokemon_id   : number;
  cp           : number | null;
  hp           : number;
  favorite     : boolean;
  most_wanted  : boolean;
  is_caught    : boolean;
  is_for_trade : boolean;
  is_wanted    : boolean;

  /* optional meta -------------------------------------------------------- */
  name?        : string;
  pokedex_number: number;
  date_available?               : string;
  date_shiny_available?         : string;
  date_shadow_available?        : string;
  date_shiny_shadow_available?  : string;
  costumes?     : Costume[];
  variantType?  : string;
  shiny_rarity? : string;
  rarity?       : string;
  location_card?: string;
  key?          : string;
  gender        : string;
  registered    : boolean;
  moves         : Move[];
  type1_name?   : string;
  type2_name?   : string;
  type_1_icon?  : string;
  type_2_icon?  : string;
  form?         : string | null;
  shiny         : boolean;
  instance_id   : string;
}

/* full bucket collection */
export interface TagBuckets {
  caught   : Record<string, TagItem>;
  trade   : Record<string, TagItem>;
  wanted  : Record<string, TagItem>;
  missing : Record<string, TagItem>;
  /** allow future custom buckets */
  [key: string]: Record<string, TagItem>;
}

/* shape used when persisting to IndexedDB */
export interface TagBucketsDB {
  [bucket: string]: Record<string, TagItem>;
}
