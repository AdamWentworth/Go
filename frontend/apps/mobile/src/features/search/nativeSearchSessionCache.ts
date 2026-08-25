import type { PokemonSearchQueryParams } from '@pokemongonexus/shared-contracts/search';
import type { NativePokemonSearchDraft } from './nativePokemonSearchDraft';
import type { NativeSearchHubView } from './NativeSearchHubHeader';

export type NativeSearchSession = {
  activeView: NativeSearchHubView;
  draft: NativePokemonSearchDraft;
  executedDraft: NativePokemonSearchDraft | null;
  ownerKey: string;
  pokemonQuery: PokemonSearchQueryParams | null;
  pokemonScrollOffset: number;
  savedAt: number;
  trainerQuery: string;
  trainerScrollOffset: number;
};

const sessions = new Map<string, NativeSearchSession>();

export const readNativeSearchSession = (
  ownerKey: string,
): NativeSearchSession | null => sessions.get(ownerKey) ?? null;

export const writeNativeSearchSession = (
  session: Omit<NativeSearchSession, 'savedAt'>,
): NativeSearchSession => {
  const complete = { ...session, savedAt: Date.now() };
  sessions.set(session.ownerKey, complete);
  return complete;
};

export const patchNativeSearchSession = (
  ownerKey: string,
  patch: Partial<Omit<NativeSearchSession, 'ownerKey' | 'savedAt'>>,
): NativeSearchSession | null => {
  const current = sessions.get(ownerKey);
  if (!current) return null;
  return writeNativeSearchSession({ ...current, ...patch, ownerKey });
};

export const clearNativeSearchSession = (ownerKey?: string): void => {
  if (ownerKey) {
    sessions.delete(ownerKey);
    return;
  }
  sessions.clear();
};
