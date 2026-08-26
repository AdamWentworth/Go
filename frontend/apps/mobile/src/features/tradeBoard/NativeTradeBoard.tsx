import { forwardRef, type ComponentProps } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type {
  NativeTradeBoardEntry,
  NativeTradeBoardModel,
  NativeTradeBoardTheme,
} from './nativeTradeBoardModel';

type Props = {
  assetBaseUrl: string;
  model: NativeTradeBoardModel;
  theme: NativeTradeBoardTheme;
};

// The board is an image-generation canvas. Keep its typography deterministic so
// exported boards do not reflow differently based on the creator's system font
// scale; the surrounding screen controls continue to honor accessibility text.
const BoardText = (props: ComponentProps<typeof Text>) => (
  <Text {...props} allowFontScaling={false} />
);

const toAssetUrl = (baseUrl: string, path: string): string => (
  /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

const PALETTES = {
  'brand-dark': {
    background: '#06162f',
    card: '#0d2339',
    border: '#2d9ef8',
    muted: '#9ab8ca',
    text: '#f7fbff',
  },
  'brand-light': {
    background: '#eaf6ff',
    card: '#ffffff',
    border: '#258ce2',
    muted: '#4c6371',
    text: '#0b2030',
  },
  minimal: {
    background: '#f7f5f0',
    card: '#ffffff',
    border: '#77736b',
    muted: '#64615b',
    text: '#1e1d1b',
  },
} as const;

const BoardEntry = ({
  assetBaseUrl,
  entry,
  palette,
}: {
  assetBaseUrl: string;
  entry: NativeTradeBoardEntry;
  palette: (typeof PALETTES)[NativeTradeBoardTheme];
}) => (
  <View style={[styles.entry, { backgroundColor: palette.card, borderColor: `${palette.border}80` }]}>
    <View style={styles.artworkStage}>
      {entry.locationBackgroundUri ? (
        <Image
          accessibilityElementsHidden
          resizeMode="cover"
          source={{ uri: toAssetUrl(assetBaseUrl, entry.locationBackgroundUri) }}
          style={styles.locationBackground}
        />
      ) : null}
      <Image
        accessibilityLabel={entry.name}
        resizeMode="contain"
        source={{ uri: toAssetUrl(assetBaseUrl, entry.imageUri ?? '/images/default_pokemon.png') }}
        style={styles.artwork}
      />
      {entry.maxKind ? (
        <Image
          accessibilityLabel={entry.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
          resizeMode="contain"
          source={{
            uri: toAssetUrl(
              assetBaseUrl,
              entry.maxKind === 'gigantamax' ? '/images/gigantamax.png' : '/images/dynamax.png',
            ),
          }}
          style={styles.maxBadge}
        />
      ) : null}
      {entry.mostWanted ? <BoardText accessibilityLabel="Most Wanted" style={styles.mostWanted}>★</BoardText> : null}
      {entry.quantity > 1 ? (
        <BoardText style={[styles.quantity, { backgroundColor: palette.border }]}>×{entry.quantity}</BoardText>
      ) : null}
    </View>
    <BoardText numberOfLines={2} style={[styles.entryName, { color: palette.text }]}>{entry.name}</BoardText>
    <BoardText style={[styles.entryNumber, { color: palette.muted }]}>#{String(entry.pokedexNumber).padStart(4, '0')}</BoardText>
    {entry.luckyRequested ? <BoardText style={styles.luckyRequested}>Lucky requested</BoardText> : null}
  </View>
);

const BoardSection = ({
  accent,
  assetBaseUrl,
  entries,
  label,
  palette,
}: {
  accent: string;
  assetBaseUrl: string;
  entries: NativeTradeBoardEntry[];
  label: string;
  palette: (typeof PALETTES)[NativeTradeBoardTheme];
}) => (
  <View style={[styles.section, { borderColor: `${accent}a6` }]}>
    <View style={styles.sectionHeader}>
      <BoardText style={[styles.sectionTitle, { color: accent }]}>{label}</BoardText>
      <BoardText style={[styles.sectionCount, { backgroundColor: `${accent}26`, color: accent }]}>{entries.length}</BoardText>
    </View>
    {entries.length ? (
      <View style={styles.grid}>
        {entries.map((entry) => (
          <BoardEntry assetBaseUrl={assetBaseUrl} entry={entry} key={entry.id} palette={palette} />
        ))}
      </View>
    ) : (
      <BoardText style={[styles.empty, { color: palette.muted }]}>No Pokémon listed here yet.</BoardText>
    )}
  </View>
);

export const NativeTradeBoard = forwardRef<View, Props>(function NativeTradeBoard({
  assetBaseUrl,
  model,
  theme,
}, ref) {
  const palette = PALETTES[theme];
  const generated = new Date(model.generatedAt);
  const generatedLabel = Number.isNaN(generated.getTime())
    ? ''
    : generated.toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <View
      collapsable={false}
      ref={ref}
      style={[styles.board, { backgroundColor: palette.background, borderColor: palette.border }]}
      testID="native-trade-board"
    >
      <View style={styles.hero}>
        <Image
          accessibilityLabel="Pokémon Go Nexus"
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/logo/lockup.png') }}
          style={styles.logo}
        />
        <View style={styles.identity}>
          <BoardText style={[styles.kicker, { color: palette.border }]}>LIVE TRADE BOARD</BoardText>
          <BoardText numberOfLines={1} style={[styles.username, { color: palette.text }]}>@{model.username}</BoardText>
          {model.pokemonGoName ? (
            <BoardText style={[styles.pogoName, { color: palette.muted }]}>Pokémon GO: {model.pokemonGoName}</BoardText>
          ) : null}
        </View>
      </View>
      <View style={styles.summary}>
        <BoardText style={styles.tradeSummary}><BoardText style={styles.summaryNumber}>{model.tradeCount}</BoardText> For Trade</BoardText>
        <BoardText style={styles.wantedSummary}><BoardText style={styles.summaryNumber}>{model.wantedCount}</BoardText> Looking For</BoardText>
      </View>
      <View style={styles.content}>
        {model.includeTrade ? (
          <BoardSection accent="#36ce83" assetBaseUrl={assetBaseUrl} entries={model.tradeEntries} label="FOR TRADE" palette={palette} />
        ) : null}
        {model.includeWanted ? (
          <BoardSection accent="#ff6678" assetBaseUrl={assetBaseUrl} entries={model.wantedEntries} label="LOOKING FOR" palette={palette} />
        ) : null}
      </View>
      <View style={[styles.footer, { borderTopColor: `${palette.border}70` }]}>
        <View style={styles.footerCopy}>
          <BoardText style={[styles.footerTitle, { color: palette.text }]}>See this board live</BoardText>
          <BoardText style={[styles.footerUrl, { color: palette.border }]} numberOfLines={1}>pokegonexus.com/trade-board/{model.username}</BoardText>
          <BoardText style={[styles.generated, { color: palette.muted }]}>Generated {generatedLabel} · Unofficial community tool</BoardText>
        </View>
        <View style={styles.qrShell}>
          <QRCode backgroundColor="#ffffff" color="#071526" quietZone={4} size={76} value={model.boardUrl} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  board: { width: '100%', maxWidth: 760, alignSelf: 'center', overflow: 'hidden', borderWidth: 2, borderRadius: 22 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  logo: { width: 128, height: 72 },
  identity: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  username: { marginTop: 2, fontSize: 23, fontWeight: '900' },
  pogoName: { marginTop: 2, fontSize: 11, fontWeight: '700' },
  summary: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 12 },
  tradeSummary: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden', backgroundColor: '#36ce8326', color: '#36ce83', fontWeight: '800' },
  wantedSummary: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden', backgroundColor: '#ff667826', color: '#ff6678', fontWeight: '800' },
  summaryNumber: { fontSize: 17, fontWeight: '900' },
  content: { gap: 12, paddingHorizontal: 12, paddingBottom: 14 },
  section: { borderWidth: 1, borderRadius: 16, padding: 9 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  sectionCount: { minWidth: 28, overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, textAlign: 'center', fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  entry: { width: '23.5%', minWidth: 0, alignItems: 'center', borderWidth: 1, borderRadius: 11, padding: 4, paddingBottom: 7 },
  artworkStage: { width: '100%', aspectRatio: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  locationBackground: { position: 'absolute', width: '100%', height: '100%', opacity: 0.8 },
  artwork: { width: '86%', height: '86%' },
  maxBadge: { position: 'absolute', top: '6%', right: '6%', width: '25%', height: '25%' },
  mostWanted: { position: 'absolute', top: 2, left: 4, color: '#ff7a56', fontSize: 19 },
  quantity: { position: 'absolute', right: 3, bottom: 3, overflow: 'hidden', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, color: '#06111a', fontSize: 10, fontWeight: '900' },
  entryName: { minHeight: 29, fontSize: 10.5, lineHeight: 13, fontWeight: '900', textAlign: 'center' },
  entryNumber: { marginTop: 1, fontSize: 9, fontWeight: '700' },
  luckyRequested: { marginTop: 3, color: '#e5ad36', fontSize: 8, fontWeight: '900', textAlign: 'center' },
  empty: { paddingVertical: 18, textAlign: 'center', fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, padding: 14 },
  footerCopy: { flex: 1, minWidth: 0 },
  footerTitle: { fontSize: 15, fontWeight: '900' },
  footerUrl: { marginTop: 3, fontSize: 10, fontWeight: '800' },
  generated: { marginTop: 5, fontSize: 8.5 },
  qrShell: { overflow: 'hidden', borderRadius: 9, backgroundColor: '#fff' },
});
