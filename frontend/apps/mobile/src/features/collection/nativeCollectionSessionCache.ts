import type { PokemonTagOrderKey } from '@pokemongonexus/shared-contracts/users';
import type { NativePokemonHubView } from './NativePokemonHubHeader';
import type {
  NativeCollectionSort,
  NativeCollectionSortDirection,
} from './collectionModel';

export type NativeCollectionSession = {
  activeView: NativePokemonHubView;
  query: string;
  scrollOffset: number;
  selectedTagKey: PokemonTagOrderKey | null;
  showEvolutionaryLine: boolean;
  sort: NativeCollectionSort;
  sortDirection: NativeCollectionSortDirection;
};

const sessions = new Map<string, NativeCollectionSession>();

export const createNativeCollectionSession = (
  initial?: Partial<NativeCollectionSession>,
): NativeCollectionSession => ({
  activeView: initial?.activeView ?? 'pokemon',
  query: initial?.query ?? '',
  scrollOffset: initial?.scrollOffset ?? 0,
  selectedTagKey: initial?.selectedTagKey ?? null,
  showEvolutionaryLine: initial?.showEvolutionaryLine ?? false,
  sort: initial?.sort ?? 'number',
  sortDirection: initial?.sortDirection ?? 'ascending',
});

export const readNativeCollectionSession = (
  ownerKey: string,
): NativeCollectionSession | null => sessions.get(ownerKey) ?? null;

export const patchNativeCollectionSession = (
  ownerKey: string,
  patch: Partial<NativeCollectionSession>,
): NativeCollectionSession => {
  const next = {
    ...(sessions.get(ownerKey) ?? createNativeCollectionSession()),
    ...patch,
  };
  sessions.set(ownerKey, next);
  return next;
};

export const clearNativeCollectionSession = (ownerKey: string): void => {
  sessions.delete(ownerKey);
};
