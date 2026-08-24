import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useMemo, useState } from 'react';
import type { NativeCollectionRow, NativeTagSummary } from './collectionModel';
import type {
  NativeCatalogDestination,
  NativeCatalogOrganizerRequest,
} from './nativeCatalogMutation';

type Props = {
  inventoryTags: NativeTagSummary[];
  wishlistTags: NativeTagSummary[];
  isSaving: boolean;
  rows: NativeCollectionRow[];
  error: string | null;
  onApply: (request: NativeCatalogOrganizerRequest) => Promise<void>;
  onClose: () => void;
  visible: boolean;
};

const CustomTagChoice = ({
  selected,
  tag,
  onPress,
  light,
}: {
  selected: boolean;
  tag: NativeTagSummary;
  onPress: () => void;
  light: boolean;
}) => (
  <Pressable
    accessibilityRole="checkbox"
    accessibilityState={{ checked: selected }}
    onPress={onPress}
    style={[
      styles.tagChoice,
      light && styles.controlLight,
      { borderColor: selected ? tag.color : light ? '#a9c0ba' : '#53615e' },
      selected ? { backgroundColor: `${tag.color}2e` } : null,
    ]}
  >
    <View style={[styles.swatch, { backgroundColor: tag.color }]} />
    <Text numberOfLines={2} style={[styles.choiceTitle, light && styles.textLight]}>{tag.name}</Text>
    <View style={[styles.check, { borderColor: tag.color }]}>
      <Text style={[styles.checkText, { color: tag.color }]}>{selected ? '✓' : ''}</Text>
    </View>
  </Pressable>
);

export const NativePokemonOrganizerSheet = ({
  inventoryTags,
  wishlistTags,
  isSaving,
  rows,
  error,
  onApply,
  onClose,
  visible,
}: Props) => {
  const light = useColorScheme() === 'light';
  const [destination, setDestination] = useState<NativeCatalogDestination>('caught');
  const [favorite, setFavorite] = useState(false);
  const [mostWanted, setMostWanted] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const customTags = useMemo(
    () => (destination === 'wanted' ? wishlistTags : inventoryTags)
      .filter((tag) => tag.tone === 'custom' && tag.key.startsWith('custom:')),
    [destination, inventoryTags, wishlistTags],
  );
  const chooseDestination = (next: NativeCatalogDestination) => {
    setDestination(next);
    setSelectedTagIds(new Set());
    if (next !== 'caught') setFavorite(false);
    if (next !== 'wanted') setMostWanted(false);
  };
  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={isSaving ? undefined : onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, light && styles.sheetLight]}>
          <View style={[styles.header, light && styles.dividerLight]}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>POKÉMON ORGANIZER</Text>
              <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Add Pokémon</Text>
              <Text style={[styles.subtitle, light && styles.secondaryLight]}>{rows.length} selected</Text>
            </View>
            <Pressable
              accessibilityLabel="Close Pokémon organizer"
              accessibilityRole="button"
              disabled={isSaving}
              onPress={onClose}
              style={[styles.close, light && styles.controlLight]}
            >
              <Text style={[styles.closeText, light && styles.textLight]}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={[styles.section, light && styles.sectionLight]}>
              <Text style={[styles.sectionEyebrow, light && styles.labelLight]}>CREATE AS</Text>
              <View style={styles.destinations}>
                {([
                  ['caught', 'Caught', 'Add new collection instances.'],
                  ['trade', 'For Trade', 'Add caught instances listed for trade.'],
                  ['wanted', 'Wanted', 'Add new wishlist entries.'],
                ] as const).map(([key, label, detail]) => {
                  const selected = destination === key;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      key={key}
                      onPress={() => chooseDestination(key)}
                      style={[
                        styles.destination,
                        light && styles.controlLight,
                        selected && styles.destinationSelected,
                      ]}
                    >
                      <Text style={[styles.destinationTitle, light && styles.textLight]}>{label}</Text>
                      <Text style={[styles.destinationDetail, light && styles.secondaryLight]}>{detail}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[
              styles.section,
              destination === 'wanted' ? styles.wantedSection : styles.caughtSection,
              light && styles.sectionLight,
            ]}>
              <Text style={[
                styles.sectionEyebrow,
                { color: destination === 'wanted' ? '#fb7185' : '#4ade80' },
              ]}>
                {destination === 'wanted' ? 'WANTED POKÉMON' : 'CAUGHT POKÉMON'}
              </Text>
              {destination === 'caught' ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: favorite }}
                  onPress={() => setFavorite((current) => !current)}
                  style={[styles.builtInChoice, light && styles.controlLight, favorite && styles.favoriteSelected]}
                >
                  <Text style={styles.favoriteIcon}>★</Text>
                  <View style={styles.choiceCopy}>
                    <Text style={[styles.choiceTitle, light && styles.textLight]}>Favorite</Text>
                    <Text style={[styles.choiceDetail, light && styles.secondaryLight]}>Keep important catches easy to find.</Text>
                  </View>
                  <Text style={styles.choiceCheck}>{favorite ? '✓' : ''}</Text>
                </Pressable>
              ) : destination === 'wanted' ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: mostWanted }}
                  onPress={() => setMostWanted((current) => !current)}
                  style={[styles.builtInChoice, light && styles.controlLight, mostWanted && styles.mostWantedSelected]}
                >
                  <Text style={styles.mostWantedIcon}>★</Text>
                  <View style={styles.choiceCopy}>
                    <Text style={[styles.choiceTitle, light && styles.textLight]}>Most Wanted</Text>
                    <Text style={[styles.choiceDetail, light && styles.secondaryLight]}>Highlight your highest-priority wishlist entries.</Text>
                  </View>
                  <Text style={styles.choiceCheck}>{mostWanted ? '✓' : ''}</Text>
                </Pressable>
              ) : null}

              <View style={styles.tagHeading}>
                <View>
                  <Text style={[styles.tagHeadingTitle, light && styles.textLight]}>Your tags</Text>
                  <Text style={[styles.choiceDetail, light && styles.secondaryLight]}>
                    {destination === 'wanted' ? 'Wanted Pokémon only' : 'Caught Pokémon only'}
                  </Text>
                </View>
              </View>
              {customTags.length ? (
                <View style={styles.tagGrid}>
                  {customTags.map((tag) => {
                    const id = tag.key.slice('custom:'.length);
                    return (
                      <CustomTagChoice
                        key={tag.key}
                        light={light}
                        onPress={() => toggleTag(id)}
                        selected={selectedTagIds.has(id)}
                        tag={tag}
                      />
                    );
                  })}
                </View>
              ) : (
                <Text style={[styles.emptyTags, light && styles.secondaryLight]}>No custom tags in this section yet.</Text>
              )}
            </View>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <View style={[styles.footer, light && styles.dividerLight]}>
            <Pressable accessibilityRole="button" disabled={isSaving} onPress={onClose} style={[styles.cancel, light && styles.controlLight]}>
              <Text style={[styles.cancelText, light && styles.secondaryLight]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void onApply({
                variantIds: rows.map((row) => row.id),
                destination,
                customTagIds: [...selectedTagIds],
                favorite,
                mostWanted,
              })}
              style={styles.apply}
            >
              {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.applyText}>Add ({rows.length})</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: { width: '100%', maxHeight: '94%', borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#171c1d', overflow: 'hidden' },
  sheetLight: { backgroundColor: '#f8fff9' },
  header: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#315052', padding: 14 },
  headerCopy: { minWidth: 0, flex: 1 },
  eyebrow: { color: '#42b9ff', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#ffffff', fontSize: 23, fontWeight: '900' },
  subtitle: { color: '#aaaaaa', fontSize: 13 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#53615e', borderRadius: 22, backgroundColor: '#202728' },
  closeText: { color: '#ffffff', fontSize: 28, lineHeight: 31 },
  body: { gap: 10, padding: 10, paddingBottom: 16 },
  section: { gap: 10, borderWidth: 1, borderColor: '#315052', borderRadius: 14, padding: 11, backgroundColor: '#111718' },
  sectionLight: { backgroundColor: '#edf5f1', borderColor: '#9bb8b1' },
  caughtSection: { borderColor: '#22c55e55' },
  wantedSection: { borderColor: '#fb718555' },
  sectionEyebrow: { color: '#8fc6cb', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  labelLight: { color: '#28636a' },
  destinations: { gap: 8 },
  destination: { minHeight: 58, justifyContent: 'center', borderWidth: 1, borderColor: '#53615e', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#202728' },
  destinationSelected: { borderColor: '#2196f3', backgroundColor: '#2196f32e' },
  destinationTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  destinationDetail: { color: '#aaaaaa', fontSize: 12, lineHeight: 16 },
  builtInChoice: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: '#53615e', borderRadius: 10, padding: 9, backgroundColor: '#202728' },
  favoriteSelected: { borderColor: '#facc15', backgroundColor: '#facc1529' },
  mostWantedSelected: { borderColor: '#f05a45', backgroundColor: '#f05a4529' },
  favoriteIcon: { width: 31, color: '#facc15', fontSize: 25, textAlign: 'center' },
  mostWantedIcon: { width: 31, color: '#f05a45', fontSize: 25, textAlign: 'center' },
  choiceCopy: { minWidth: 0, flex: 1 },
  choiceTitle: { minWidth: 0, flex: 1, color: '#ffffff', fontSize: 14, fontWeight: '900' },
  choiceDetail: { color: '#aaaaaa', fontSize: 11, lineHeight: 15 },
  choiceCheck: { width: 24, color: '#ffffff', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  tagHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagHeadingTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  tagGrid: { gap: 7 },
  tagChoice: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 10, padding: 9, backgroundColor: '#202728' },
  swatch: { width: 15, height: 15, borderRadius: 8 },
  check: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 7 },
  checkText: { fontSize: 16, fontWeight: '900' },
  emptyTags: { color: '#aaaaaa', fontSize: 13 },
  error: { borderWidth: 1, borderColor: '#ef5b72', borderRadius: 10, padding: 10, color: '#ff91a2', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  footer: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#315052', padding: 10, paddingBottom: 14, backgroundColor: '#171c1d' },
  dividerLight: { borderColor: '#9bb8b1', backgroundColor: '#f8fff9' },
  cancel: { minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#53615e', borderRadius: 10 },
  cancelText: { color: '#aaaaaa', fontWeight: '900' },
  apply: { minHeight: 48, flex: 1.35, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#007bff' },
  applyText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  controlLight: { borderColor: '#a9c0ba', backgroundColor: '#ffffff' },
  textLight: { color: '#405753' },
  secondaryLight: { color: '#4b625e' },
});
