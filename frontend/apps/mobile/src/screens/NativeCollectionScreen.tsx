import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  filterNativeCollectionRows,
  type NativeCollectionFilter,
  type NativeCollectionRow,
} from '../features/collection/collectionModel';
import { NativeCollectionSyncStatusCard } from '../features/collection/NativeCollectionSyncStatusCard';
import { NativeCollectionTabs } from '../features/collection/NativeCollectionTabs';
import { NativePokemonGridCard } from '../features/collection/NativePokemonGridCard';
import { theme } from '../ui/theme';

type NativeCollectionScreenProps = {
  rows: NativeCollectionRow[];
  filter: NativeCollectionFilter;
  query: string;
  isLoading: boolean;
  error: string | null;
  cachedAt: number | null;
  actionMenuImageUri: string;
  onFilterChange: (filter: NativeCollectionFilter) => void;
  onQueryChange: (query: string) => void;
  onRetry: () => void;
  onOpenInstance: (instanceId: string) => void;
  onOpenTags: () => void;
  onOpenWishlist: () => void;
  onOpenCurrentApp: () => void;
};

const filters: {
  key: NativeCollectionFilter;
  label: string;
  accessibilityLabel: string;
}[] = [
  { key: 'all', label: 'All', accessibilityLabel: 'All Pokémon' },
  { key: 'caught', label: 'Caught', accessibilityLabel: 'Caught Pokémon' },
  { key: 'trade', label: 'For Trade', accessibilityLabel: 'For Trade Pokémon' },
  { key: 'wanted', label: 'Wanted', accessibilityLabel: 'Wanted Pokémon' },
];

const filterTones = {
  all: { border: '#6b7280', surface: '#2b2b2b', text: '#ffffff' },
  caught: { border: '#2a94ff', surface: '#153658', text: '#d8ecff' },
  trade: { border: '#41c77a', surface: '#143b28', text: '#d6ffe8' },
  wanted: { border: '#ff526b', surface: '#4a2028', text: '#ffe1e6' },
} as const;

const collectionColumnCount = (width: number): number => {
  if (width < 481) return 3;
  if (width < 1024) return 6;
  return 9;
};

export const NativeCollectionScreen = ({
  rows,
  filter,
  query,
  isLoading,
  error,
  cachedAt,
  actionMenuImageUri,
  onFilterChange,
  onQueryChange,
  onRetry,
  onOpenInstance,
  onOpenTags,
  onOpenWishlist,
  onOpenCurrentApp,
}: NativeCollectionScreenProps) => {
  const { width } = useWindowDimensions();
  const columnCount = collectionColumnCount(width);
  const visibleRows = filterNativeCollectionRows(rows, filter, query);

  return (
    <View style={styles.screen} testID="native-collection-screen">
      <NativeCollectionTabs
        activeSection="pokemon"
        pokemonCount={visibleRows.length}
        onOpenPokemon={() => onFilterChange('all')}
        onOpenTags={onOpenTags}
        onOpenWishlist={onOpenWishlist}
      />

      <View style={styles.collectionControls}>
        <View style={styles.searchShell}>
          <Text accessibilityElementsHidden style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Search your collection"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onQueryChange}
            placeholder="Search"
            placeholderTextColor="#777777"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityLabel="Clear collection search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onQueryChange('')}
              style={({ pressed }) => [styles.clearSearch, pressed && styles.pressed]}
            >
              <Text style={styles.clearSearchText}>×</Text>
            </Pressable>
          ) : null}
        </View>

        <View accessibilityRole="tablist" style={styles.filters}>
          {filters.map((entry) => {
            const selected = filter === entry.key;
            const tone = filterTones[entry.key];
            return (
              <Pressable
                accessibilityLabel={entry.accessibilityLabel}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={entry.key}
                onPress={() => onFilterChange(entry.key)}
                style={({ pressed }) => [
                  styles.filterButton,
                  selected && {
                    borderColor: tone.border,
                    backgroundColor: tone.surface,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.filterText, selected && { color: tone.text }]}>
                  {entry.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.content}
        data={visibleRows}
        initialNumToRender={columnCount * 5}
        key={`native-collection-${columnCount}`}
        keyExtractor={(item) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        numColumns={columnCount}
        ListHeaderComponent={(
          <View style={styles.statusArea}>
            {error ? (
              <View accessibilityRole="alert" style={styles.errorCard}>
                <View style={styles.messageCopy}>
                  <Text style={styles.errorTitle}>Collection unavailable</Text>
                  <Text style={styles.errorBody}>{error}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            {cachedAt != null ? (
              <View accessibilityLiveRegion="polite" style={styles.cachedCard}>
                <Text style={styles.cachedTitle}>Offline copy</Text>
                <Text style={styles.cachedBody}>Saved Pokémon and retained edits are shown.</Text>
              </View>
            ) : null}

            <NativeCollectionSyncStatusCard />
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator color="#ffffff" size="large" />
                <Text style={styles.emptyTitle}>Loading your Pokémon…</Text>
              </>
            ) : !error ? (
              <>
                <Text style={styles.emptyTitle}>No Pokémon found</Text>
                <Text style={styles.emptyBody}>Try another search or collection filter.</Text>
              </>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => (
          <NativePokemonGridCard
            columnCount={columnCount}
            item={item}
            onOpen={onOpenInstance}
          />
        )}
        testID="native-collection-grid"
        windowSize={9}
      />

      <Pressable
        accessibilityHint="Opens every feature in the current app"
        accessibilityLabel="Open action menu in current app"
        accessibilityRole="button"
        onPress={onOpenCurrentApp}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      >
        <Text accessibilityElementsHidden style={styles.actionFallback}>◉</Text>
        <Image
          accessibilityElementsHidden
          resizeMode="contain"
          source={{ uri: actionMenuImageUri }}
          style={styles.actionImage}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111111' },
  collectionControls: {
    gap: 9,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
    backgroundColor: '#111111',
  },
  searchShell: {
    width: '88%',
    maxWidth: 560,
    minHeight: 44,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
  },
  searchIcon: { color: '#727272', fontSize: 24, lineHeight: 25 },
  searchInput: {
    minHeight: 44,
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 0,
    color: '#111111',
    fontSize: 16,
    textAlign: 'center',
  },
  clearSearch: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#c3c3c3',
  },
  clearSearchText: { color: '#505050', fontSize: 26, lineHeight: 27 },
  filters: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  filterButton: {
    minHeight: 36,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#303030',
    borderRadius: 999,
    paddingHorizontal: 5,
    backgroundColor: '#191919',
  },
  filterText: { color: '#929292', fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.68 },
  content: { flexGrow: 1, paddingHorizontal: 4, paddingTop: 6, paddingBottom: 104 },
  gridRow: { alignItems: 'flex-start' },
  statusArea: { gap: 7, paddingHorizontal: 8, paddingBottom: 7 },
  errorCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#ef5b72',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    backgroundColor: '#32151d',
  },
  messageCopy: { flex: 1, gap: 2 },
  errorTitle: { color: '#ffffff', fontWeight: '900' },
  errorBody: { color: '#fecdd3', fontSize: theme.type.caption },
  retryButton: {
    minWidth: 66,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: '#ef5b72',
  },
  retryText: { color: '#ffffff', fontWeight: '900' },
  cachedCard: {
    minHeight: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8d6a28',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#2a2112',
  },
  cachedTitle: { color: '#ffe2a8', fontWeight: '900' },
  cachedBody: { color: '#e4c88e', fontSize: theme.type.caption },
  emptyState: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 9 },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyBody: { color: '#9ca3af', textAlign: 'center' },
  actionButton: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    width: 64,
    height: 64,
    marginLeft: -32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.72)',
    borderRadius: 32,
    backgroundColor: '#1b1b1b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 9,
  },
  actionButtonPressed: { opacity: 0.82, transform: [{ scale: 0.95 }] },
  actionFallback: { position: 'absolute', color: '#f4f4f4', fontSize: 36 },
  actionImage: { width: 57, height: 57 },
});
