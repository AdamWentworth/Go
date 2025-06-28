// db/constants.ts

export const isIOS: boolean =
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);

if (isIOS) {
  console.log(`Detected iOS device: ${isIOS}`);
}

// Database Names
export const DB_NAME: string = 'pokemonDB';
export const LISTS_DB_NAME: string = 'pokemonListsDB';
export const TRADES_DB_NAME: string = 'tradesDB';
export const UPDATES_DB_NAME: string = 'batchedUpdatesDB';
export const POKEDEX_LISTS_DB_NAME: string = 'PokedexListsDB';

// DB Version
export const DB_VERSION: number = 1;

// Store Names for Main DB (pokemonDB)
export const VARIANTS_STORE: string = 'pokemonVariants';
export const OWNERSHIP_DATA_STORE: string = 'pokemonOwnership';

// Store Names for the Batched Updates DB
export const BATCHED_POKEMON_UPDATES_STORE: string = 'batchedPokemonUpdates';
export const BATCHED_TRADE_UPDATES_STORE: string = 'batchedTradeUpdates';

// Store names for listsDB
export const LIST_STORES: string[] = ['owned', 'unowned', 'wanted', 'trade'];

// Trades DB Constants
export const POKEMON_TRADES_STORE: string = 'pokemonTrades';
export const RELATED_INSTANCES_STORE: string = 'relatedInstances';

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

// Store names for pokedexListsDB
export const POKEDEX_LISTS_STORES: string[] = [
  'default',
  'shiny',
  'costume',
  'shadow',
  'shiny costume',
  'shiny shadow',
  'shadow costume',
  'mega',
  'shiny mega',
  'dynamax',
  'shiny dynamax',
  'gigantamax',
  'shiny gigantamax',
  'fusion',
  'shiny fusion',
];
