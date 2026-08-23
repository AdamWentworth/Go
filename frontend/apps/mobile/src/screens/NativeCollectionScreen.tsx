import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  filterNativeCollectionRows,
  type NativeCollectionFilter,
  type NativeCollectionRow,
} from '../features/collection/collectionModel';
import { theme } from '../ui/theme';

type NativeCollectionScreenProps = {
  rows: NativeCollectionRow[];
  filter: NativeCollectionFilter;
  query: string;
  isLoading: boolean;
  error: string | null;
  onFilterChange: (filter: NativeCollectionFilter) => void;
  onQueryChange: (query: string) => void;
  onRetry: () => void;
  onBack: () => void;
  onOpenCurrentApp: () => void;
};

const filters: { key: NativeCollectionFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'caught', label: 'Caught' },
  { key: 'trade', label: 'Trade' },
  { key: 'wanted', label: 'Wanted' },
];

const statusLabels: Record<NativeCollectionRow['status'], string> = {
  caught: 'Caught',
  trade: 'For trade',
  wanted: 'Wanted',
};

const statusStyles = {
  caught: { color: '#79c2ff', borderColor: '#2385e8' },
  trade: { color: '#61e5a3', borderColor: '#2fbd79' },
  wanted: { color: '#ff8b9d', borderColor: '#ef5b72' },
} as const;

export const NativeCollectionScreen = ({
  rows,
  filter,
  query,
  isLoading,
  error,
  onFilterChange,
  onQueryChange,
  onRetry,
  onBack,
  onOpenCurrentApp,
}: NativeCollectionScreenProps) => {
  const visibleRows = filterNativeCollectionRows(rows, filter, query);

  return (
    <View style={styles.screen} testID="native-collection-screen">
      <FlatList
        data={visibleRows}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.headerContent}>
            <View style={styles.topBar}>
              <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>‹</Text>
              </Pressable>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>NATIVE COLLECTION</Text>
                <Text accessibilityRole="header" style={styles.title}>Your Pokémon</Text>
              </View>
              <View style={styles.headerCount}>
                <Text style={styles.headerCountText}>{rows.length.toLocaleString()}</Text>
              </View>
            </View>

            <TextInput
              accessibilityLabel="Search your collection"
              autoCapitalize="none"
              onChangeText={onQueryChange}
              placeholder="Search name or Pokédex number"
              placeholderTextColor="#8193a7"
              style={styles.searchInput}
              value={query}
            />

            <View accessibilityRole="tablist" style={styles.filters}>
              {filters.map((entry) => {
                const selected = filter === entry.key;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    key={entry.key}
                    onPress={() => onFilterChange(entry.key)}
                    style={[styles.filterButton, selected && styles.filterButtonSelected]}
                  >
                    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Collection unavailable</Text>
                <Text style={styles.errorBody}>{error}</Text>
                <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator color="#5ed8ff" size="large" />
                <Text style={styles.emptyTitle}>Loading your collection…</Text>
              </>
            ) : !error ? (
              <>
                <Text style={styles.emptyTitle}>No Pokémon found</Text>
                <Text style={styles.emptyBody}>Try another name or collection filter.</Text>
              </>
            ) : null}
          </View>
        )}
        ListFooterComponent={(
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              onPress={onOpenCurrentApp}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Edit in current app</Text>
            </Pressable>
            <Text style={styles.footerText}>
              This native milestone is intentionally read-only.
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const status = statusStyles[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.dexNumber}>#{String(item.pokedexNumber).padStart(4, '0')}</Text>
                {item.favorite ? <Text accessibilityLabel="Favorite" style={styles.favorite}>★</Text> : null}
                {item.mostWanted ? <Text accessibilityLabel="Most wanted" style={styles.mostWanted}>★</Text> : null}
              </View>
              <View style={styles.imageFrame}>
                {item.imageUri ? (
                  <Image resizeMode="contain" source={{ uri: item.imageUri }} style={styles.image} />
                ) : (
                  <Text style={styles.imageFallback}>#{item.pokemonId}</Text>
                )}
              </View>
              <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
              <View style={[styles.statusBadge, { borderColor: status.borderColor }]}>
                <Text style={[styles.statusText, { color: status.color }]}>
                  {statusLabels[item.status]}
                </Text>
              </View>
              {item.cp != null ? <Text style={styles.cp}>CP {item.cp.toLocaleString()}</Text> : null}
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06162f' },
  content: {
    flexGrow: 1,
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  headerContent: { gap: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm },
  topBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#385773',
    borderRadius: theme.radius.md,
    backgroundColor: '#0c203a',
  },
  backButtonText: { color: '#fff', fontSize: 36, lineHeight: 38 },
  headingCopy: { flex: 1 },
  eyebrow: { color: '#5ed8ff', fontSize: theme.type.caption, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerCount: {
    minWidth: 48,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#173954',
  },
  headerCountText: { color: '#dff6ff', fontWeight: '800' },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#385773',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    color: '#fff',
    backgroundColor: '#0c203a',
  },
  filters: { flexDirection: 'row', gap: theme.spacing.xs },
  filterButton: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#385773',
    borderRadius: theme.radius.md,
    backgroundColor: '#0c203a',
  },
  filterButtonSelected: { borderColor: '#2385e8', backgroundColor: '#123b68' },
  filterText: { color: '#aebdcc', fontSize: theme.type.caption, fontWeight: '700' },
  filterTextSelected: { color: '#fff' },
  row: { gap: theme.spacing.sm },
  card: {
    minHeight: 238,
    flex: 1,
    maxWidth: '49%',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#294962',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    backgroundColor: '#0b1c2d',
  },
  cardTopRow: { minHeight: 21, flexDirection: 'row', alignItems: 'center' },
  dexNumber: { flex: 1, color: '#8ca3b8', fontSize: theme.type.caption, fontWeight: '700' },
  favorite: { color: '#ffd75f', fontSize: 20 },
  mostWanted: { color: '#ff704d', fontSize: 20 },
  imageFrame: { height: 104, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  imageFallback: { color: '#8193a7', fontWeight: '800' },
  name: { minHeight: 40, color: '#fff', fontSize: theme.type.body, fontWeight: '800', textAlign: 'center' },
  statusBadge: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  statusText: { fontSize: theme.type.caption, fontWeight: '800' },
  cp: { color: '#9fb3c8', fontSize: theme.type.caption, textAlign: 'center' },
  emptyState: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: '#9fb3c8', textAlign: 'center' },
  errorCard: {
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#ef5b72',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: '#341827',
  },
  errorTitle: { color: '#fff', fontWeight: '800' },
  errorBody: { color: '#fecdd3' },
  retryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: '#ef5b72',
  },
  retryText: { color: '#fff', fontWeight: '800' },
  footer: { gap: theme.spacing.sm, paddingTop: theme.spacing.md },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.selectedBorder,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  footerText: { color: '#8ca3b8', fontSize: theme.type.caption, textAlign: 'center' },
});
