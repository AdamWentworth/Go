import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
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
  onOpenCanonicalCollection: () => void;
  onClearTag: () => void;
  onViewChange: (view: NativePokemonHubView) => void;
  showHeader?: boolean;
};

const SORT_OPTIONS: { key: NativeCollectionSort; label: string }[] = [
  { key: 'number', label: 'Pokédex number' },
  { key: 'name', label: 'Name' },
  { key: 'cp', label: 'Combat Power' },
  { key: 'favorite', label: 'Favorite' },
];

const SORT_ICONS: Record<NativeCollectionSort, string> = {
  number: '/images/sorting/number.png',
  name: '/images/sorting/name.png',
  cp: '/images/sorting/cp.png',
  favorite: '/images/sorting/favorite.png',
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
  onOpenCanonicalCollection,
  onClearTag,
  onViewChange,
  showHeader = true,
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
  const sortLabel = SORT_OPTIONS.find((option) => option.key === sort)?.label ?? 'Pokédex number';
  const theme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View style={styles.screen} testID="native-collection-parity-screen">
      <NativeCollectionParityFixture
        activeTag={activeTag?.name ?? null}
        assetBaseUrl={assetBaseUrl}
        cards={cards}
        collectionCount={visibleRows.length}
        error={error}
        isLoading={isLoading}
        onActionMenuPress={onOpenCanonicalCollection}
        onCardPress={(card) => onOpenInstance(card.id)}
        customTagColor={activeTag?.color}
        onClearTag={onClearTag}
        onQueryChange={onQueryChange}
        onToggleEvolutionaryLine={() => setShowEvolutionaryLine((current) => !current)}
        onRetry={onRetry}
        onSortPress={() => setSortOpen(true)}
        onPokemonPress={() => onViewChange('pokemon')}
        onTagsPress={() => onViewChange('inventory')}
        onWishlistPress={() => onViewChange('wishlist')}
        query={query}
        sortDirection={direction}
        sortIconPath={SORT_ICONS[sort]}
        sortLabel={`Sort by ${sortLabel} ${direction}`}
        showEvolutionaryLine={showEvolutionaryLine}
        tagCanClear={Boolean(activeTag)}
        tagTone={activeTag?.tone ?? 'caught'}
        theme={theme}
        showHeader={showHeader}
      />

      <Modal
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
        transparent
        visible={sortOpen}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close sort menu"
            accessibilityRole="button"
            onPress={() => setSortOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={styles.sortSheet}
          >
            <Text accessibilityRole="header" style={styles.sortTitle}>Sort Pokémon</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map((option) => {
                const selected = option.key === sort;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={option.key}
                    onPress={() => setSort(option.key)}
                    style={[styles.sortOption, selected && styles.sortOptionSelected]}
                  >
                    <Text style={[styles.sortOptionText, selected && styles.sortOptionTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.directionRow}>
              {(['ascending', 'descending'] as const).map((value) => {
                const selected = value === direction;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={value}
                    onPress={() => setDirection(value)}
                    style={[styles.directionButton, selected && styles.sortOptionSelected]}
                  >
                    <Text style={[styles.sortOptionText, selected && styles.sortOptionTextSelected]}>
                      {value === 'ascending' ? 'Ascending' : 'Descending'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSortOpen(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  sortSheet: {
    width: '100%',
    maxWidth: 520,
    gap: 12,
    borderWidth: 1,
    borderColor: '#48635f',
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#17201f',
  },
  sortTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  sortOptions: { gap: 8 },
  sortOption: {
    minHeight: 46,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#40504e',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#202a29',
  },
  sortOptionSelected: { borderColor: '#42d4c4', backgroundColor: '#16433e' },
  sortOptionText: { color: '#c6d2cf', fontSize: 15, fontWeight: '700' },
  sortOptionTextSelected: { color: '#fff' },
  directionRow: { flexDirection: 'row', gap: 8 },
  directionButton: {
    minHeight: 46,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#40504e',
    borderRadius: 10,
    backgroundColor: '#202a29',
  },
  doneButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#42d4c4',
  },
  doneButtonText: { color: '#071311', fontSize: 16, fontWeight: '900' },
});
