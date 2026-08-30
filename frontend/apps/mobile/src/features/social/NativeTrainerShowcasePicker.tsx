import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeCollectionRow } from '../collection/collectionModel';
import { NativePokemonLocationBackdrop } from '../collection/parity/NativePokemonLocationBackdrop';
import { useNativeModalAnimation } from '../settings/useNativeMotion';
import { useNativeColorScheme } from '../settings/useNativeColorScheme';

type Props = {
  assetBaseUrl: string;
  candidates: NativeCollectionRow[];
  onClear: () => void;
  onClose: () => void;
  onSelect: (instanceId: string) => void;
  selectedIds: string[];
  slotIndex: number;
  visible: boolean;
};

export const NativeTrainerShowcasePicker = ({
  assetBaseUrl,
  candidates,
  onClear,
  onClose,
  onSelect,
  selectedIds,
  slotIndex,
  visible,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const animationType = useNativeModalAnimation('slide');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return candidates;
    return candidates.filter((row) => (
      row.name.toLocaleLowerCase().includes(normalized)
      || String(row.pokedexNumber).includes(normalized)
      || String(row.cp ?? '').includes(normalized)
    ));
  }, [candidates, query]);
  const selected = new Set(selectedIds.filter(Boolean));
  const currentId = selectedIds[slotIndex] ?? '';

  return (
    <Modal
      animationType={animationType}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.screen, light && styles.screenLight]}
        testID="native-trainer-showcase-picker"
      >
        <View style={[styles.header, light && styles.dividerLight]}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PROFILE SHOWCASE · SLOT {slotIndex + 1}</Text>
            <Text style={[styles.title, light && styles.textLight]}>Choose a caught Pokémon</Text>
            <Text style={[styles.copy, light && styles.mutedLight]}>
              Featured Pokémon keep their current details and collection status.
            </Text>
          </View>
          <Pressable accessibilityLabel="Close showcase picker" accessibilityRole="button" onPress={onClose} style={[styles.close, light && styles.closeLight]}>
            <Text style={[styles.closeText, light && styles.textLight]}>×</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Search caught Pokémon"
            onChangeText={setQuery}
            placeholder="Search Pokémon, Pokédex number, or CP"
            placeholderTextColor={light ? '#718083' : '#7f9495'}
            selectionColor="#35a8ff"
            style={[styles.search, light && styles.searchLight, light && styles.textLight]}
            value={query}
          />
          {currentId ? (
            <Pressable accessibilityRole="button" onPress={onClear} style={[styles.clearButton, light && styles.clearButtonLight]}>
              <Text style={[styles.clearText, light && styles.textLight]}>Clear slot</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.resultCount, light && styles.mutedLight]}>
          {filtered.length.toLocaleString('en-US')} caught Pokémon
        </Text>
        <ScrollView contentContainerStyle={styles.grid} keyboardShouldPersistTaps="handled">
          {filtered.map((row) => {
            const isCurrent = row.id === currentId;
            const usedElsewhere = !isCurrent && selected.has(row.id);
            return (
              <Pressable
                accessibilityLabel={`${row.name}${isCurrent ? ', selected in this slot' : usedElsewhere ? ', already featured' : ''}`}
                accessibilityRole="button"
                disabled={usedElsewhere}
                key={row.id}
                onPress={() => onSelect(row.id)}
                style={[
                  styles.card,
                  light && styles.cardLight,
                  isCurrent && styles.cardSelected,
                  usedElsewhere && styles.cardDisabled,
                ]}
              >
                {row.locationBackgroundUri ? <NativePokemonLocationBackdrop uri={row.locationBackgroundUri} /> : null}
                {row.imageUri ? <Image resizeMode="contain" source={{ uri: row.imageUri }} style={styles.image} /> : null}
                {row.maxKind ? (
                  <Image
                    resizeMode="contain"
                    source={{ uri: `${assetBaseUrl.replace(/\/$/, '')}/images/${row.maxKind}.png` }}
                    style={styles.maxIcon}
                  />
                ) : null}
                <Text numberOfLines={2} style={[styles.name, light && styles.textLight]}>{row.name}</Text>
                <Text style={[styles.detail, light && styles.mutedLight]}>
                  {row.cp ? `CP ${row.cp.toLocaleString('en-US')}` : `#${String(row.pokedexNumber).padStart(4, '0')}`}
                </Text>
                {isCurrent || usedElsewhere ? (
                  <Text style={[styles.badge, isCurrent ? styles.badgeCurrent : styles.badgeUsed]}>
                    {isCurrent ? 'THIS SLOT' : 'FEATURED'}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, light && styles.textLight]}>No caught Pokémon match</Text>
              <Text style={[styles.copy, light && styles.mutedLight]}>Try another name, number, or CP.</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 18, backgroundColor: '#081012' },
  screenLight: { backgroundColor: '#f8fff9' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderColor: '#315052' },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#35a8ff', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#f7fbfa', fontSize: 23, lineHeight: 29, fontWeight: '900' },
  copy: { color: '#9db5b4', fontSize: 12, lineHeight: 17 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#456265', borderRadius: 22, backgroundColor: '#171f20' },
  closeLight: { borderColor: '#aababc', backgroundColor: '#ffffff' },
  closeText: { color: '#ffffff', fontSize: 28, lineHeight: 30 },
  dividerLight: { borderColor: '#bdc8ca' },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  search: { flex: 1, minHeight: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: '#456265', borderRadius: 10, backgroundColor: '#171f20', color: '#f7fbfa', fontSize: 14, fontWeight: '700' },
  searchLight: { borderColor: '#aababc', backgroundColor: '#ffffff' },
  clearButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: '#a9434d', borderRadius: 10, backgroundColor: '#3b1d22' },
  clearButtonLight: { backgroundColor: '#fff2f3' },
  clearText: { color: '#ff9ba8', fontSize: 11, fontWeight: '900' },
  resultCount: { paddingHorizontal: 17, paddingVertical: 9, color: '#9db5b4', fontSize: 11, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 40 },
  card: { position: 'relative', width: '31.5%', minHeight: 144, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', padding: 7, borderWidth: 1, borderColor: '#315052', borderRadius: 9, backgroundColor: '#11191a' },
  cardLight: { borderColor: '#bdc8ca', backgroundColor: '#ffffff' },
  cardSelected: { borderWidth: 2, borderColor: '#35a8ff', backgroundColor: '#12324b' },
  cardDisabled: { opacity: 0.42 },
  image: { width: 80, height: 78, marginBottom: 3 },
  maxIcon: { position: 'absolute', top: 7, right: 7, width: 23, height: 23 },
  name: { color: '#f7fbfa', fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'center' },
  detail: { color: '#9db5b4', fontSize: 9, lineHeight: 12 },
  badge: { position: 'absolute', top: 7, left: 7, overflow: 'hidden', paddingHorizontal: 5, paddingVertical: 3, borderRadius: 8, color: '#061617', fontSize: 7, fontWeight: '900' },
  badgeCurrent: { backgroundColor: '#5eb1f4' },
  badgeUsed: { backgroundColor: '#9db5b4' },
  empty: { width: '100%', alignItems: 'center', gap: 3, paddingVertical: 50 },
  emptyTitle: { color: '#f7fbfa', fontSize: 17, fontWeight: '900' },
  textLight: { color: '#172124' },
  mutedLight: { color: '#5e6c6f' },
});
