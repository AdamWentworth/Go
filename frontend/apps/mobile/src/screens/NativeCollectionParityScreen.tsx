import { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import type { CollectionParityCardFixture } from '../features/collection/parity/collectionParityFixtures';
import { NativeCollectionParityFixture } from '../features/collection/parity/NativeCollectionParityFixture';
import {
  filterNativeCollectionRows,
  sortNativeCollectionRows,
  type NativeCollectionRow,
  type NativeCollectionSort,
  type NativeCollectionSortDirection,
  type NativeTagSummary,
} from '../features/collection/collectionModel';
import type { NativePokemonHubView } from '../features/collection/NativePokemonHubHeader';
import {
  NATIVE_SORT_OPTIONS,
  NativeCollectionSortMenu,
} from '../features/collection/parity/NativeCollectionSortMenu';

type NativeCollectionParityScreenProps = {
  assetBaseUrl: string;
  rows: NativeCollectionRow[];
  searchUniverseRows?: NativeCollectionRow[];
  activeTag: NativeTagSummary | null;
  query: string;
  isLoading: boolean;
  error: string | null;
  onQueryChange: (query: string) => void;
  onRetry: () => void;
  onOpenInstance: (instanceId: string) => void;
  onLongPressInstance?: (instanceId: string) => void;
  onOpenCanonicalCollection: () => void;
  onClearTag: () => void;
  onViewChange: (view: NativePokemonHubView) => void;
  showHeader?: boolean;
  selectedIds?: ReadonlySet<string>;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  onSelectionActionPress?: () => void;
  selectionAction?: 'add' | 'organize';
};

const SORT_ICONS: Record<NativeCollectionSort, string> = {
  releaseDate: '/images/sorting/recent.png',
  favorite: '/images/sorting/favorite.png',
  number: '/images/sorting/number.png',
  hp: '/images/sorting/hp.png',
  name: '/images/sorting/name.png',
  combatPower: '/images/sorting/cp.png',
};

const toParityCard = (
  row: NativeCollectionRow,
  showOwnership: boolean,
): CollectionParityCardFixture => ({
  id: row.id,
  cp: row.cp,
  dexNumber: row.pokedexNumber,
  name: row.name,
  imagePath: row.imageUri ?? `/images/disabled/disabled_${row.pokemonId}.png`,
  typeIconPaths: row.typeIconUris,
  favorite: row.favorite,
  mostWanted: row.mostWanted,
  lucky: row.lucky,
  locationBackgroundPath: row.locationBackgroundUri ?? undefined,
  maxKind: row.maxKind ?? undefined,
  ownership: showOwnership && row.source !== 'catalog' ? row.status : undefined,
  purified: row.purified,
});

export const NativeCollectionParityScreen = ({
  assetBaseUrl,
  rows,
  searchUniverseRows = rows,
  activeTag,
  query,
  isLoading,
  error,
  onQueryChange,
  onRetry,
  onOpenInstance,
  onLongPressInstance,
  onOpenCanonicalCollection,
  onClearTag,
  onViewChange,
  showHeader = true,
  selectedIds = new Set<string>(),
  onClearSelection,
  onSelectAll,
  onSelectionActionPress,
  selectionAction = 'organize',
}: NativeCollectionParityScreenProps) => {
  const colorScheme = useColorScheme();
  const [sort, setSort] = useState<NativeCollectionSort>('number');
  const [direction, setDirection] = useState<NativeCollectionSortDirection>('ascending');
  const [sortOpen, setSortOpen] = useState(false);
  const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(false);
  const filteredRows = useMemo(
    () => filterNativeCollectionRows(rows, 'all', query, {
      showEvolutionaryLine,
      universeRows: searchUniverseRows,
    }),
    [query, rows, searchUniverseRows, showEvolutionaryLine],
  );
  const visibleRows = useMemo(
    () => sortNativeCollectionRows(filteredRows, sort, direction),
    [direction, filteredRows, sort],
  );
  const cards = useMemo(
    () => visibleRows.map((row) => toParityCard(row, Boolean(activeTag))),
    [activeTag, visibleRows],
  );
  const sortLabel = NATIVE_SORT_OPTIONS.find((option) => option.key === sort)?.label ?? 'NUMBER';
  const theme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View style={styles.screen} testID="native-collection-parity-screen">
      <NativeCollectionParityFixture
        activeTag={activeTag?.filterName ?? activeTag?.name ?? null}
        assetBaseUrl={assetBaseUrl}
        cards={cards}
        collectionCount={visibleRows.length}
        error={error}
        isLoading={isLoading}
        onActionMenuPress={onOpenCanonicalCollection}
        onCardPress={(card) => onOpenInstance(card.id)}
        onCardLongPress={onLongPressInstance ? (card) => onLongPressInstance(card.id) : undefined}
        customTagColor={activeTag?.color}
        onClearTag={onClearTag}
        onQueryChange={onQueryChange}
        onToggleEvolutionaryLine={() => setShowEvolutionaryLine((current) => !current)}
        onRetry={onRetry}
        onSortPress={() => setSortOpen(true)}
        onPokemonPress={() => onViewChange('pokemon')}
        onTagsPress={() => onViewChange('inventory')}
        onWishlistPress={() => onViewChange('wishlist')}
        onClearSelection={onClearSelection}
        onSelectAll={onSelectAll}
        onSelectionActionPress={onSelectionActionPress}
        query={query}
        sortDirection={direction}
        sortIconPath={SORT_ICONS[sort]}
        sortLabel={`Sort by ${sortLabel} ${direction}`}
        showEvolutionaryLine={showEvolutionaryLine}
        tagCanClear={Boolean(activeTag)}
        tagTone={activeTag?.tone ?? 'caught'}
        theme={theme}
        showHeader={showHeader}
        selectedIds={selectedIds}
        selectionAction={selectionAction}
      />

      <NativeCollectionSortMenu
        assetBaseUrl={assetBaseUrl}
        direction={direction}
        onClose={() => setSortOpen(false)}
        onSelect={(nextSort) => {
          if (nextSort === sort) {
            setDirection((current) => current === 'ascending' ? 'descending' : 'ascending');
          } else {
            setSort(nextSort);
            setDirection(nextSort === 'favorite' ? 'descending' : 'ascending');
          }
          setSortOpen(false);
        }}
        open={sortOpen}
        sort={sort}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
