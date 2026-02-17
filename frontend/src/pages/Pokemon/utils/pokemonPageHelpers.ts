import type { InstanceStatus } from '@/types/instances';
import type { PokemonVariant } from '@/types/pokemonVariants';

export type ActiveView = 'pokedex' | 'pokemon' | 'tags';
export type LastMenu = 'pokedex' | 'ownership';

const ACTIVE_VIEW_SEQUENCE: ActiveView[] = ['pokedex', 'pokemon', 'tags'];

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
  const basePct = -idx * 100;
  const offsetPct = width > 0 ? (dragOffset / width) * 100 : 0;
  return `translate3d(${basePct + offsetPct}%,0,0)`;
};

export const getPokedexSubLabel = (
  isUsernamePath: boolean,
  lastMenu: LastMenu,
  selectedPokedexKey: string,
): string | undefined => {
  if (isUsernamePath || lastMenu !== 'pokedex') {
    return undefined;
  }
  return `(${(selectedPokedexKey || 'all').toUpperCase()})`;
};

export const getTagsSubLabel = (
  lastMenu: LastMenu,
  tagFilter: string,
): string | undefined => {
  if (lastMenu !== 'ownership' || !tagFilter) {
    return undefined;
  }
  return `(${tagFilter.toUpperCase()})`;
};

