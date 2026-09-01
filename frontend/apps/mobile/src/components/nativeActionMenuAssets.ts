export const NATIVE_ACTION_MENU_DESTINATIONS = [
  { icon: '/images/btn_raid.png', label: 'Raid', path: '/raid' },
  { icon: '/images/btn_pokedex.png', label: 'Pokédex', path: '/pokedex' },
  { icon: '/images/btn_pvp.png', label: 'PvP', path: '/pvp' },
  { icon: '/images/btn_search.png', label: 'Search', path: '/search' },
  { icon: '/images/btn_home.png', label: 'Home', path: '/' },
  { icon: '/images/btn_trades.png', label: 'Trades', path: '/trades' },
  { icon: '/images/btn_pokemon.png', label: 'Pokémon', path: '/pokemon' },
  { icon: '/images/btn_max.png', label: 'Max Battles', path: '/max' },
  { icon: '/images/btn_rankings.png', label: 'Rankings', path: '/rankings' },
] as const;

export const NATIVE_ACTION_MENU_ASSET_PATHS = [
  '/images/btn_action_menu.png',
  ...NATIVE_ACTION_MENU_DESTINATIONS.map((destination) => destination.icon),
  '/images/profile-icon.png',
  '/images/btn_settings.png',
  '/images/register-icon.png',
  '/images/login-icon.png',
  '/images/close-button.png',
  '/images/close-button-light.png',
] as const;

export const toNativeActionMenuAssetUrl = (baseUrl: string, path: string): string => (
  /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);
