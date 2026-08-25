import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { PokemonCommunityRankingsPayload } from '@pokemongonexus/shared-contracts/search';
import type { PokemonCatalogEntry } from '@pokemongonexus/shared-domain/catalog';

export type NativeRankingMode = 'wanted' | 'rarest';
export type NativeRankingCategory = 'all' | 'shiny' | 'costume' | 'shadow' | 'max';
export type NativeRankingCollectionFilter = 'all' | 'owned' | 'trade' | 'wanted' | 'missing';
export type NativeRankingPersonalStatus = { caughtCount: number; registered: boolean; tradeCount: number; wanted: boolean };
export type NativeRankingRow = {
  caughtUsers: number;
  entry: PokemonCatalogEntry;
  mostWantedUsers: number | null;
  personal: NativeRankingPersonalStatus;
  rank: number;
  wantedUsers: number | null;
};

const emptyPersonalStatus = (): NativeRankingPersonalStatus => ({ caughtCount: 0, registered: false, tradeCount: 0, wanted: false });
const canBeTraded = (instance: PokemonInstance): boolean => Boolean(
  instance.is_caught && !instance.shadow && !instance.lucky && !instance.mega
  && !instance.is_mega && !instance.is_fused && ![2270, 2271].includes(Number(instance.pokemon_id)),
);

export const buildNativeRankingPersonalStatuses = (
  instances: Record<string, PokemonInstance>,
): Map<string, NativeRankingPersonalStatus> => {
  const statuses = new Map<string, NativeRankingPersonalStatus>();
  Object.values(instances).forEach((instance) => {
    const variantId = String(instance.variant_id ?? '').trim();
    if (!variantId || instance.disabled) return;
    const status = statuses.get(variantId) ?? emptyPersonalStatus();
    status.registered ||= Boolean(instance.registered || instance.is_caught);
    status.wanted ||= Boolean(instance.is_wanted && !variantId.toLocaleLowerCase().includes('shadow'));
    if (instance.is_caught) status.caughtCount += 1;
    if (instance.is_for_trade && canBeTraded(instance)) status.tradeCount += 1;
    statuses.set(variantId, status);
  });
  return statuses;
};

const rankingCategory = (entry: PokemonCatalogEntry): NativeRankingCategory => {
  const id = entry.id.toLocaleLowerCase();
  if (entry.maxKind) return 'max';
  if (id.includes('shadow')) return 'shadow';
  if (id.includes('shiny')) return 'shiny';
  const suffix = id.slice(id.indexOf('-') + 1);
  return suffix && suffix !== 'default' ? 'costume' : 'all';
};
const matchesCollection = (personal: NativeRankingPersonalStatus, filter: NativeRankingCollectionFilter): boolean => {
  if (filter === 'owned') return personal.registered;
  if (filter === 'trade') return personal.tradeCount > 0;
  if (filter === 'wanted') return personal.wanted;
  if (filter === 'missing') return !personal.registered;
  return true;
};

export const buildNativeRankingRows = ({ catalog, collectionFilter = 'all', instances = {}, category = 'all', mode, payload, query = '' }: {
  catalog: PokemonCatalogEntry[];
  collectionFilter?: NativeRankingCollectionFilter;
  instances?: Record<string, PokemonInstance>;
  category?: NativeRankingCategory;
  mode: NativeRankingMode;
  payload: PokemonCommunityRankingsPayload | null | undefined;
  query?: string;
}): NativeRankingRow[] => {
  if (!payload) return [];
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const statuses = buildNativeRankingPersonalStatuses(instances);
  const normalized = query.trim().toLocaleLowerCase();
  const source = mode === 'wanted' ? payload.most_wanted : payload.rarest;
  return source.flatMap((ranking, index) => {
    const entry = byId.get(ranking.variant_id);
    if (!entry) return [];
    if (mode === 'wanted' && entry.id.toLocaleLowerCase().includes('shadow')) return [];
    if (category !== 'all' && rankingCategory(entry) !== category) return [];
    if (normalized && !entry.name.toLocaleLowerCase().includes(normalized)
      && !String(entry.pokedexNumber).includes(normalized)
      && !entry.id.toLocaleLowerCase().includes(normalized)) return [];
    const personal = statuses.get(entry.id) ?? emptyPersonalStatus();
    if (!matchesCollection(personal, collectionFilter)) return [];
    return [{ caughtUsers: ranking.caught_users, entry, mostWantedUsers: ranking.most_wanted_users, personal, rank: index + 1, wantedUsers: ranking.wanted_users }];
  });
};

