import type { InstanceStatus } from '@/types/instances';
import type { PokemonVariant } from '@/types/pokemonVariants';

export type ActiveView = 'pokedex' | 'pokemon' | 'tags';
export type LastMenu = 'pokedex' | 'ownership';

const ACTIVE_VIEW_SEQUENCE: ActiveView[] = ['pokedex', 'pokemon', 'tags'];
const HAVE_TAG_FILTERS = new Set(['Favorites', 'Trade', 'Caught']);
const WISHLIST_TAG_FILTERS = new Set(['Most Wanted', 'Wanted']);

export const isActiveView = (value: string): value is ActiveView =>
  ACTIVE_VIEW_SEQUENCE.includes(value as ActiveView);

export const toInstanceStatus = (value: string): InstanceStatus | null => {
  if (value === 'Caught' || value === 'Trade' || value === 'Wanted' || value === 'Missing') {
    return value;
  }
  return null;
};

export const buildSelectAllIds = (pokemons: PokemonVariant[]): string[] =>
  pokemons
    .map((pokemon) => pokemon.instanceData?.instance_id ?? pokemon.variant_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

export const clampDragOffset = (
  dragOffset: number,
  width: number,
  maxPeekDistance: number,
): number => {
  const max = width * maxPeekDistance;
  return Math.max(-max, Math.min(max, dragOffset));
};

export const buildSliderTransform = (
  activeView: ActiveView,
  dragOffset: number,
  width: number,
): string => {
  const idx = ACTIVE_VIEW_SEQUENCE.indexOf(activeView);
  const effectiveWidth = width > 0 ? width : 0;
  const baseOffset = -idx * effectiveWidth;
  return `translate3d(${baseOffset + dragOffset}px,0,0)`;
};

const getOwnershipSubLabel = (
  filters: Set<string>,
  lastMenu: LastMenu,
  tagFilter: string,
): string | undefined => {
  if (lastMenu !== 'ownership' || !tagFilter || !filters.has(tagFilter)) {
    return undefined;
  }
  return `(${tagFilter.toUpperCase()})`;
};

export const getHaveTagsSubLabel = (
  lastMenu: LastMenu,
  tagFilter: string,
): string | undefined => getOwnershipSubLabel(HAVE_TAG_FILTERS, lastMenu, tagFilter);

export const getWishlistSubLabel = (
  lastMenu: LastMenu,
  tagFilter: string,
): string | undefined => getOwnershipSubLabel(WISHLIST_TAG_FILTERS, lastMenu, tagFilter);
