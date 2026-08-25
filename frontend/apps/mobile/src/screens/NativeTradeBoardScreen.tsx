import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeActionMenuAnchor } from '../components/NativeActionMenuAnchor';
import { NativeTradeBoard } from '../features/tradeBoard/NativeTradeBoard';
import type {
  NativeTradeBoardModel,
  NativeTradeBoardTheme,
} from '../features/tradeBoard/nativeTradeBoardModel';

type Props = {
  assetBaseUrl: string;
  error?: string | null;
  isLoading?: boolean;
  model: NativeTradeBoardModel | null;
  editable?: boolean;
  onActionMenuPress: () => void;
  onBack: () => void;
  onOpenCollection: () => void;
  onRetry: () => void;
  ownerUsername?: string;
};

const THEMES: { id: NativeTradeBoardTheme; label: string }[] = [
  { id: 'brand-dark', label: 'Nexus Dark' },
  { id: 'brand-light', label: 'Nexus Light' },
  { id: 'minimal', label: 'Minimal' },
];

export const NativeTradeBoardScreen = ({
  assetBaseUrl,
  error = null,
  isLoading = false,
  model,
  editable = true,
  onActionMenuPress,
  onBack,
  onOpenCollection,
  onRetry,
  ownerUsername,
}: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const boardRef = useRef<View>(null);
  const [includeTrade, setIncludeTrade] = useState(true);
  const [includeWanted, setIncludeWanted] = useState(true);
  const [theme, setTheme] = useState<NativeTradeBoardTheme>('brand-dark');
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const visibleModel = useMemo(() => model ? {
    ...model,
    includeTrade,
    includeWanted,
    tradeCount: includeTrade ? model.tradeCount : 0,
    tradeEntries: includeTrade ? model.tradeEntries : [],
    wantedCount: includeWanted ? model.wantedCount : 0,
    wantedEntries: includeWanted ? model.wantedEntries : [],
  } : null, [includeTrade, includeWanted, model]);

  const shareBoard = async () => {
    if (!visibleModel || !boardRef.current || sharing) return;
    setSharing(true);
    setNotice(null);
    try {
      const uri = await captureRef(boardRef, {
        fileName: `pokegonexus-${visibleModel.username}-trade-board`,
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `Share @${visibleModel.username}'s Trade Board`,
          mimeType: 'image/png',
          UTI: 'public.png',
        });
      } else {
        await Share.share({ message: visibleModel.boardUrl, title: 'Pokémon Go Nexus Trade Board' });
      }
      setNotice('Your Trade Board is ready to share.');
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'The Trade Board could not be shared.');
    } finally {
      setSharing(false);
    }
  };

  const copyOrShareLink = async () => {
    if (!visibleModel) return;
    await Share.share({ message: visibleModel.boardUrl, title: 'Pokémon Go Nexus Trade Board' });
  };

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-trade-board-screen">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 112 }]}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.controlLight]}>
            <Text style={[styles.backText, light && styles.textLight]}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>SHAREABLE COLLECTION</Text>
            <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Trade Board</Text>
            <Text style={[styles.subtitle, light && styles.mutedLight]}>
              {editable
                ? 'Create one polished image of what you have and what you want.'
                : `Explore and share @${ownerUsername ?? model?.username ?? 'trainer'}'s live listings.`}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={[styles.state, light && styles.panelLight]}>
            <ActivityIndicator color="#299cf5" size="large" />
            <Text style={[styles.stateTitle, light && styles.textLight]}>Preparing your Trade Board…</Text>
          </View>
        ) : error ? (
          <View accessibilityRole="alert" style={[styles.state, styles.errorState, light && styles.panelLight]}>
            <Text style={[styles.stateTitle, light && styles.textLight]}>Your Trade Board could not load</Text>
            <Text style={[styles.stateCopy, light && styles.mutedLight]}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : !model || model.tradeCount + model.wantedCount === 0 ? (
          <View style={[styles.state, light && styles.panelLight]}>
            <Text style={styles.stateGlyph}>↗</Text>
            <Text style={[styles.stateTitle, light && styles.textLight]}>
              {editable ? 'Your Trade Board needs a listing' : 'No public listings yet'}
            </Text>
            <Text style={[styles.stateCopy, light && styles.mutedLight]}>
              {editable
                ? 'Mark at least one Pokémon as For Trade or Wanted, then this board stays synchronized automatically.'
                : `@${ownerUsername ?? 'This trainer'} has not published any For Trade or Wanted Pokémon.`}
            </Text>
            <Pressable accessibilityRole="button" onPress={onOpenCollection} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{editable ? 'Add Pokémon listings' : 'View trainer catalog'}</Text>
            </Pressable>
          </View>
        ) : visibleModel ? (
          <>
            <View style={[styles.controls, light && styles.panelLight]}>
              <Text style={[styles.controlsTitle, light && styles.textLight]}>Board options</Text>
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={[styles.switchTitle, styles.tradeText]}>For Trade</Text>
                  <Text style={[styles.switchDetail, light && styles.mutedLight]}>{model.tradeCount} listed Pokémon</Text>
                </View>
                <Switch accessibilityLabel="Include For Trade Pokémon" onValueChange={(value) => setIncludeTrade(value || !includeWanted)} value={includeTrade} />
              </View>
              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={[styles.switchTitle, styles.wantedText]}>Looking For</Text>
                  <Text style={[styles.switchDetail, light && styles.mutedLight]}>{model.wantedCount} wanted Pokémon</Text>
                </View>
                <Switch accessibilityLabel="Include Looking For Pokémon" onValueChange={(value) => setIncludeWanted(value || !includeTrade)} value={includeWanted} />
              </View>
              <Text style={[styles.themeLabel, light && styles.mutedLight]}>BOARD STYLE</Text>
              <View style={styles.themeRow}>
                {THEMES.map((option) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: theme === option.id }}
                    key={option.id}
                    onPress={() => setTheme(option.id)}
                    style={[styles.themeButton, light && styles.controlLight, theme === option.id && styles.themeButtonActive]}
                  >
                    <Text style={[styles.themeText, light && styles.textLight, theme === option.id && styles.themeTextActive]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <NativeTradeBoard assetBaseUrl={assetBaseUrl} model={visibleModel} ref={boardRef} theme={theme} />
            {notice ? <Text accessibilityLiveRegion="polite" style={[styles.notice, light && styles.textLight]}>{notice}</Text> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => void copyOrShareLink()} style={[styles.secondaryButton, light && styles.controlLight]}>
                <Text style={[styles.secondaryButtonText, light && styles.textLight]}>Share live link</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={sharing} onPress={() => void shareBoard()} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{sharing ? 'Preparing image…' : 'Share board image'}</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
      <NativeActionMenuAnchor assetBaseUrl={assetBaseUrl} onPress={onActionMenuPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#071014' },
  rootLight: { backgroundColor: '#edf3f5' },
  content: { width: '100%', maxWidth: 900, alignSelf: 'center', gap: 14, paddingHorizontal: 12 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#405054', borderRadius: 22, backgroundColor: '#182124' },
  backText: { color: '#fff', fontSize: 34, lineHeight: 35 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#2f9cff', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#f6fbfc', fontSize: 29, lineHeight: 34, fontWeight: '900' },
  subtitle: { maxWidth: 620, color: '#9db0b5', fontSize: 13, lineHeight: 19 },
  controls: { gap: 8, borderWidth: 1, borderColor: '#34484c', borderRadius: 16, padding: 13, backgroundColor: '#141d20' },
  controlsTitle: { color: '#f6fbfc', fontSize: 17, fontWeight: '900' },
  switchRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: '#2b393c', paddingTop: 8 },
  switchCopy: { flex: 1 },
  switchTitle: { fontSize: 14, fontWeight: '900' },
  switchDetail: { marginTop: 2, color: '#9db0b5', fontSize: 11 },
  tradeText: { color: '#36ce83' },
  wantedText: { color: '#ff6678' },
  themeLabel: { marginTop: 3, color: '#9db0b5', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  themeRow: { flexDirection: 'row', gap: 7 },
  themeButton: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#43565a', borderRadius: 10, backgroundColor: '#1a2427' },
  themeButtonActive: { borderColor: '#2f9cff', backgroundColor: '#12345a' },
  themeText: { color: '#b3c0c4', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  themeTextActive: { color: '#fff' },
  state: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#34484c', borderRadius: 18, padding: 24, backgroundColor: '#141d20' },
  errorState: { borderColor: '#ef6077' },
  stateGlyph: { color: '#2f9cff', fontSize: 36, fontWeight: '900' },
  stateTitle: { color: '#f6fbfc', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  stateCopy: { maxWidth: 560, color: '#9db0b5', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  panelLight: { borderColor: '#b7c4c8', backgroundColor: '#fff' },
  textLight: { color: '#102025' },
  mutedLight: { color: '#586a70' },
  controlLight: { borderColor: '#aebdc1', backgroundColor: '#f6f9fa' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 18, backgroundColor: '#168ef0' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  secondaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#43565a', borderRadius: 11, paddingHorizontal: 16, backgroundColor: '#182124' },
  secondaryButtonText: { color: '#eaf2f4', fontSize: 13, fontWeight: '800' },
  notice: { color: '#b9d1d7', fontSize: 12, textAlign: 'center' },
});
