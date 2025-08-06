// db/constants.ts

/* -------------------------------------------------------------------------- */
/*  Device helper                                                             */
/* -------------------------------------------------------------------------- */
export const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

/* -------------------------------------------------------------------------- */
/*  Database names                                                            */
/* -------------------------------------------------------------------------- */
export const VARIANTS_DB_NAME      = 'variantsDB';
export const INSTANCES_DB_NAME     = 'instancesDB';
export const TAGS_DB_NAME          = 'tagsDB';         // single DB for all tag data
export const TRADES_DB_NAME        = 'tradesDB';
export const UPDATES_DB_NAME       = 'updatesDB';
export const POKEDEX_DB_NAME       = 'pokedexDB';
export const REGISTRATIONS_DB_NAME = 'registrationsDB';

/* -------------------------------------------------------------------------- */
/*  IMPORTANT: do not change the version (not deployed yet)                   */
/* -------------------------------------------------------------------------- */
export const DB_VERSION = 1;

/* Object stores ------------------------------------------------------------ */
export const VARIANTS_STORE       = 'variants';
export const INSTANCES_STORE      = 'instances';

/** Legacy per-bucket stores (kept for compatibility during transition) */
export const TAG_STORE_NAMES = ['caught', 'wanted', 'trade', 'missing'] as const;
/** New normalized tag stores (custom tags + memberships) */
export const TAG_DEFS_STORE      = 'tagDefs';       // keyPath: 'tag_id'
export const INSTANCE_TAGS_STORE = 'instanceTags';  // keyPath: 'key' = `${tag_id}:${instance_id}`

export const POKEMON_TRADES_STORE    = 'trades';
export const RELATED_INSTANCES_STORE = 'relatedInstances';
export const REGISTRATIONS_STORE     = 'registrations';

/* Batched-update stores ---------------------------------------------------- */
export const BATCHED_POKEMON_UPDATES_STORE = 'batchedPokemonUpdates';
export const BATCHED_TRADE_UPDATES_STORE   = 'batchedTradeUpdates';

/* Pokedex category stores -------------------------------------------------- */
export const POKEDEX_STORES = [
  'default','shiny','costume','shadow','shiny costume','shiny shadow',
  'shadow costume','mega','shiny mega','dynamax','shiny dynamax',
  'gigantamax','shiny gigantamax','fusion','shiny fusion',
] as const;

// Enums for trades
export const TRADE_STATUSES = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  DENIED: 'denied',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const TRADE_FRIENDSHIP_LEVELS: { [key: number]: string } = {
  1: 'Good',
  2: 'Great',
  3: 'Ultra',
  4: 'Best',
};
