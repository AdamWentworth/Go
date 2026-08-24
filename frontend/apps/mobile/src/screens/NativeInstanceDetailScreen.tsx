import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { NativeInstanceDetail } from '../features/collection/collectionModel';
import { NativePokemonLocationBackdrop } from '../features/collection/parity/NativePokemonLocationBackdrop';

type Props = {
  assetBaseUrl?: string;
  detail: NativeInstanceDetail | null;
  isLoading: boolean;
  error: string | null;
  cachedAt: number | null;
  movesWarning: string | null;
  saveNotice: string | null;
  saveError: string | null;
  isSaving: boolean;
  onRetry: () => void;
  onBack: () => void;
  onToggleFavorite: (favorite: boolean) => void;
  onEditInCurrentApp: () => void;
};

const toAssetUrl = (baseUrl: string, path: string): string => (
  /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

const primaryTypeName = (detail: NativeInstanceDetail): string => {
  const match = detail.row.typeIconUris[0]?.match(/\/([^/?]+)\.png(?:\?|$)/i);
  return match?.[1]?.toLowerCase() ?? 'normal';
};

const backgroundPath = (detail: NativeInstanceDetail): string => {
  const instance = detail.instance;
  if (instance?.shadow && !instance.purified) return '/images/backgrounds/bg_shadow.png';
  if (instance?.lucky || (instance?.is_wanted && instance.pref_lucky)) {
    return '/images/backgrounds/bg_lucky.png';
  }
  return `/images/backgrounds/bg_${primaryTypeName(detail)}.png`;
};

const STATUS = {
  caught: { accent: '#58c7eb', label: null },
  trade: { accent: '#53d39a', label: 'FOR TRADE' },
  wanted: { accent: '#ff617d', label: 'WANTED' },
} as const;

const LevelArc = ({ level }: { level: number }) => {
  const bounded = Math.max(1, Math.min(51, level));
  const angle = Math.PI - ((bounded - 1) / 50) * Math.PI;
  const pointX = 150 + (126 * Math.cos(angle));
  const pointY = 136 - (126 * Math.sin(angle));
  return (
    <Svg accessibilityElementsHidden height={146} viewBox="0 0 300 146" width={300}>
      <Path
        d="M24 136 A126 126 0 0 1 276 136"
        fill="none"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth={3}
      />
      <Circle cx={pointX} cy={pointY} fill="#ffffff" r={6} />
    </Svg>
  );
};

const DetailRows = ({
  rows,
  secondaryColor,
  textColor,
}: {
  rows: { label: string; value: string }[];
  secondaryColor: string;
  textColor: string;
}) => (
  <View style={styles.detailRows}>
    {rows.map((row) => (
      <View key={row.label} style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: secondaryColor }]}>{row.label}</Text>
        <Text style={[styles.detailValue, { color: textColor }]}>{row.value}</Text>
      </View>
    ))}
  </View>
);

export const NativeInstanceDetailScreen = ({
  assetBaseUrl = 'https://pokegonexus.com',
  detail,
  isLoading,
  error,
  cachedAt,
  movesWarning,
  saveNotice,
  saveError,
  isSaving,
  onRetry,
  onBack,
  onToggleFavorite,
  onEditInCurrentApp,
}: Props) => {
  const light = useColorScheme() === 'light';
  const { width } = useWindowDimensions();
  const shellWidth = Math.min(width * 0.95, 500);
  const palette = light ? LIGHT : DARK;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.fallbackBackground }]}>
        <ActivityIndicator color="#5ed8ff" size="large" />
        <Text style={{ color: palette.secondary }}>Loading Pokémon details…</Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.fallbackBackground }]}>
        <Text accessibilityRole="header" style={[styles.errorTitle, { color: palette.text }]}>Pokémon unavailable</Text>
        <Text style={[styles.errorBody, { color: palette.secondary }]}>{error ?? 'This instance was not found.'}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={[styles.secondaryButton, { borderColor: palette.border }]}
        >
          <Text style={[styles.secondaryButtonText, { color: palette.text }]}>Back to collection</Text>
        </Pressable>
      </View>
    );
  }

  const instance = detail.instance;
  const status = STATUS[detail.row.status];
  const level = instance?.level ?? Number(
    detail.stats.find((row) => row.label === 'Level')?.value ?? Number.NaN,
  );
  const cp = instance?.cp ?? detail.row.cp;
  const weight = instance?.weight;
  const height = instance?.height;
  const gender = instance?.gender;
  const showPhysicalRow = weight != null || height != null || detail.row.typeIconUris.length > 0;
  const showArc = Number.isFinite(level);
  const maxBadge = detail.row.maxKind
    ? toAssetUrl(assetBaseUrl, `/images/${detail.row.maxKind}.png`)
    : null;
  const statusLabel = detail.row.status === 'wanted' && detail.row.mostWanted
    ? 'MOST WANTED'
    : status.label;

  return (
    <View style={styles.overlay} testID="native-instance-overlay">
      <Image
        accessibilityElementsHidden
        blurRadius={3}
        resizeMode="cover"
        source={{ uri: toAssetUrl(assetBaseUrl, backgroundPath(detail)) }}
        style={styles.fullBackground}
      />
      <View style={styles.backgroundTint} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={[styles.shell, { width: shellWidth }]}>
          {cachedAt != null ? (
            <View accessibilityLiveRegion="polite" style={styles.offlineBanner}>
              <Text style={styles.offlineTitle}>Viewing an offline copy</Text>
              <Text style={styles.offlineBody}>Saved changes will synchronize after reconnecting.</Text>
            </View>
          ) : null}

          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel="Edit in current app"
              accessibilityRole="button"
              onPress={onEditInCurrentApp}
              style={styles.iconButton}
            >
              <Text style={[styles.editIcon, { color: palette.text }]}>✎</Text>
            </Pressable>
            {cp != null ? (
              <Text style={[styles.cpText, { color: palette.text }]}>CP{cp}</Text>
            ) : <View />}
            {detail.row.status === 'caught' ? (
              <Pressable
                accessibilityLabel={detail.row.favorite ? 'Remove Favorite' : 'Mark as Favorite'}
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => onToggleFavorite(!detail.row.favorite)}
                style={styles.iconButton}
              >
                <Text style={[styles.favoriteIcon, detail.row.favorite && styles.favoriteSelected]}>
                  {detail.row.favorite ? '★' : '☆'}
                </Text>
              </Pressable>
            ) : detail.row.status === 'wanted' ? (
              <View style={[styles.wantedBadge, detail.row.mostWanted && styles.mostWantedBadge]}>
                <Text style={[styles.wantedBadgeText, detail.row.mostWanted && styles.mostWantedBadgeText]}>
                  {detail.row.mostWanted ? '★ Most Wanted' : '☆ Wanted'}
                </Text>
              </View>
            ) : <View style={styles.iconButton} />}
          </View>

          {showArc ? (
            <View style={styles.arc}>
              <LevelArc level={level} />
            </View>
          ) : null}

          <View style={styles.imageStage}>
            {detail.row.locationBackgroundUri ? (
              <View style={[styles.locationBackdrop, { width: Math.min(shellWidth, 447) }]}>
                <NativePokemonLocationBackdrop uri={detail.row.locationBackgroundUri} />
              </View>
            ) : null}
            {detail.row.lucky ? (
              <Image
                accessibilityElementsHidden
                resizeMode="contain"
                source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky.png') }}
                style={styles.luckyBackdrop}
              />
            ) : null}
            {detail.row.imageUri ? (
              <Image
                accessibilityLabel={detail.row.name}
                resizeMode="contain"
                source={{ uri: detail.row.imageUri }}
                style={styles.pokemonImage}
              />
            ) : null}
            {maxBadge ? (
              <Image
                accessibilityLabel={detail.row.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
                resizeMode="contain"
                source={{ uri: maxBadge }}
                style={styles.maxBadge}
              />
            ) : null}
            {detail.row.purified ? (
              <Image
                accessibilityLabel="Purified"
                resizeMode="contain"
                source={{ uri: toAssetUrl(assetBaseUrl, '/images/purified.png') }}
                style={styles.purifiedBadge}
              />
            ) : null}
          </View>

          <View style={[styles.detailsPanel, { backgroundColor: palette.panel }]}>
            {statusLabel ? (
              <Text style={[styles.statusEyebrow, { color: status.accent }]}>{statusLabel}</Text>
            ) : null}
            <Text accessibilityRole="header" style={[styles.name, { color: palette.text }]}>
              {detail.row.name}
            </Text>

            <View style={styles.levelGenderRow}>
              <View style={styles.sideSlot} />
              {showArc ? (
                <Text style={[styles.levelText, { color: palette.secondary }]}>LEVEL: {level}</Text>
              ) : <View />}
              <Text style={[styles.genderText, { color: gender === 'Female' ? '#ff3b87' : '#30a7ff' }]}>
                {gender === 'Female' ? '♀' : gender === 'Male' ? '♂' : ''}
              </Text>
            </View>

            {showPhysicalRow ? (
              <View style={styles.physicalRow}>
                <View style={styles.physicalValue}>
                  {weight != null ? (
                    <>
                      <Text style={[styles.statValue, { color: palette.text }]}>{weight}kg</Text>
                      <Text style={[styles.statLabel, { color: palette.secondary }]}>WEIGHT</Text>
                    </>
                  ) : null}
                </View>
                <View style={[styles.pipe, { backgroundColor: palette.divider }]} />
                <View style={styles.types}>
                  {detail.row.typeIconUris.map((uri) => (
                    <Image key={uri} source={{ uri }} style={styles.typeIcon} />
                  ))}
                </View>
                <View style={[styles.pipe, { backgroundColor: palette.divider }]} />
                <View style={styles.physicalValue}>
                  {height != null ? (
                    <>
                      <Text style={[styles.statValue, { color: palette.text }]}>{height}m</Text>
                      <Text style={[styles.statLabel, { color: palette.secondary }]}>HEIGHT</Text>
                    </>
                  ) : null}
                </View>
              </View>
            ) : null}

            {detail.moves.length || movesWarning ? (
              <View style={[styles.section, { borderTopColor: palette.divider }]}>
                <View style={styles.moveTabs}>
                  <Text style={[styles.moveTabActive, { color: palette.text, borderBottomColor: palette.text }]}>GYMS &amp; RAIDS</Text>
                  <Text style={[styles.moveTab, { color: palette.secondary }]}>TRAINER BATTLES</Text>
                </View>
                {detail.moves.length ? (
                  <DetailRows rows={detail.moves} secondaryColor={palette.secondary} textColor={palette.text} />
                ) : null}
                {movesWarning ? <Text style={styles.warningText}>{movesWarning}</Text> : null}
              </View>
            ) : null}

            {detail.ivs.length ? (
              <View style={[styles.section, { borderTopColor: palette.divider }]}>
                {detail.ivs.map((iv) => (
                  <View key={iv.label} style={styles.ivRow}>
                    <Text style={styles.ivLabel}>{iv.label}</Text>
                    <View style={[styles.ivTrack, { backgroundColor: palette.track }]}>
                      <View style={[styles.ivFill, { width: `${Math.max(0, Math.min(15, iv.value)) / 15 * 100}%` }]} />
                      <View style={styles.ivThird} />
                      <View style={styles.ivTwoThirds} />
                    </View>
                    <Text style={styles.ivNumber}>{iv.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {detail.preferences.length ? (
              <View style={[styles.preferencePanel, { borderColor: status.accent }]}>
                <Text style={[styles.preferenceTitle, { color: status.accent }]}>
                  {detail.row.status === 'wanted' ? 'WANTED CONDITIONS' : 'TRADE CONDITIONS'}
                </Text>
                <DetailRows rows={detail.preferences} secondaryColor={palette.secondary} textColor={palette.text} />
              </View>
            ) : null}

            {detail.provenance.length ? (
              <View style={[styles.metaPanel, { backgroundColor: palette.meta }]}>
                <DetailRows rows={detail.provenance} secondaryColor={palette.secondary} textColor={palette.text} />
              </View>
            ) : null}

            {saveNotice ? (
              <View accessibilityLiveRegion="polite" style={styles.notice}>
                <Text style={styles.noticeText}>{saveNotice}</Text>
              </View>
            ) : null}
            {saveError ? (
              <View accessibilityRole="alert" style={styles.saveError}>
                <Text style={styles.saveErrorText}>{saveError}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.closeButton}
      >
        <Image
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, light ? '/images/close-button-light.png' : '/images/close-button.png') }}
          style={styles.closeImage}
        />
      </Pressable>
    </View>
  );
};

const DARK = {
  border: '#64748b',
  divider: '#808080',
  fallbackBackground: '#0f2b2b',
  meta: 'rgba(255,255,255,0.08)',
  panel: '#333333',
  secondary: '#aeb8b5',
  text: '#e0f0e5',
  track: '#d9dce0',
};

const LIGHT = {
  border: '#6f8883',
  divider: '#8a9b98',
  fallbackBackground: '#e8f6f2',
  meta: 'rgba(23,59,66,0.06)',
  panel: '#f7fbf8',
  secondary: '#58716c',
  text: '#173b42',
  track: '#d5dfdd',
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0f2b2b' },
  fullBackground: { ...StyleSheet.absoluteFill, width: '106%', height: '106%', left: '-3%', top: '-3%' },
  backgroundTint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,43,43,0.08)' },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingTop: 30, paddingBottom: 104 },
  shell: { maxWidth: 500, alignItems: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  errorTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  errorBody: { textAlign: 'center' },
  primaryButton: { minWidth: 240, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#147de2' },
  primaryButtonText: { color: '#fff', fontWeight: '900' },
  secondaryButton: { minWidth: 240, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  secondaryButtonText: { fontWeight: '800' },
  offlineBanner: { width: '94%', gap: 2, marginBottom: 8, padding: 9, borderWidth: 1, borderColor: '#a87524', borderRadius: 12, backgroundColor: 'rgba(51,39,20,0.92)' },
  offlineTitle: { color: '#ffe2a8', fontWeight: '900', textAlign: 'center' },
  offlineBody: { color: '#f7d99b', fontSize: 12, textAlign: 'center' },
  headerRow: { zIndex: 7, width: '100%', minHeight: 52, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 12 },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  editIcon: { fontSize: 45, lineHeight: 48, fontWeight: '300', transform: [{ rotate: '-18deg' }] },
  cpText: { paddingTop: 3, fontSize: 18, fontWeight: '500' },
  favoriteIcon: { color: '#ffffff', fontSize: 48, lineHeight: 50, fontWeight: '300' },
  favoriteSelected: { color: '#ffd000' },
  wantedBadge: { minHeight: 40, justifyContent: 'center', marginTop: 1, paddingHorizontal: 12, borderWidth: 1, borderColor: '#8b9997', borderRadius: 999, backgroundColor: 'rgba(53,61,61,0.82)' },
  mostWantedBadge: { borderColor: '#ff704d' },
  wantedBadgeText: { color: '#c5cdcb', fontSize: 12, fontWeight: '900' },
  mostWantedBadgeText: { color: '#ff8a63' },
  arc: { position: 'absolute', zIndex: 1, top: 48, alignSelf: 'center' },
  imageStage: { zIndex: 3, width: 272, height: 272, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  locationBackdrop: { position: 'absolute', top: -20, height: 292 },
  luckyBackdrop: { position: 'absolute', zIndex: 2, width: 272, height: 272 },
  pokemonImage: { zIndex: 4, width: 267, height: 267 },
  maxBadge: { position: 'absolute', zIndex: 5, top: 5, right: 5, width: 92, height: 92 },
  purifiedBadge: { position: 'absolute', zIndex: 5, bottom: 5, left: 5, width: 54, height: 54 },
  detailsPanel: { width: '100%', minHeight: 300, alignItems: 'center', marginTop: -36, paddingTop: 64, paddingBottom: 18, borderRadius: 12, overflow: 'hidden' },
  statusEyebrow: { marginBottom: 4, fontSize: 12, fontWeight: '900', letterSpacing: 1.7 },
  name: { maxWidth: '92%', fontSize: 42, lineHeight: 46, fontWeight: '500', textAlign: 'center' },
  levelGenderRow: { width: '100%', minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  sideSlot: { width: 42 },
  levelText: { fontSize: 12, fontWeight: '800' },
  genderText: { width: 42, fontSize: 34, lineHeight: 36, fontWeight: '500', textAlign: 'right' },
  physicalRow: { width: '100%', minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  physicalValue: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: '500' },
  statLabel: { fontSize: 11, fontWeight: '800' },
  pipe: { width: 2, height: 38 },
  types: { minWidth: 94, flexDirection: 'row', justifyContent: 'center', gap: 5, paddingHorizontal: 10 },
  typeIcon: { width: 24, height: 24 },
  section: { width: '94%', marginTop: 12, paddingTop: 12, borderTopWidth: 2 },
  moveTabs: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginBottom: 8 },
  moveTabActive: { paddingBottom: 4, borderBottomWidth: 2, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  moveTab: { paddingBottom: 4, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  detailRows: { width: '100%' },
  detailRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  detailLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  detailValue: { flexShrink: 1, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  warningText: { color: '#ffd18a', paddingHorizontal: 8, lineHeight: 19 },
  ivRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4 },
  ivLabel: { width: 66, color: '#ff9700', fontSize: 16, fontWeight: '700' },
  ivTrack: { flex: 1, height: 14, overflow: 'hidden', borderRadius: 7 },
  ivFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 7, backgroundColor: '#ff9d23' },
  ivThird: { position: 'absolute', left: '33.333%', width: 2, top: 0, bottom: 0, backgroundColor: '#ffffff' },
  ivTwoThirds: { position: 'absolute', left: '66.666%', width: 2, top: 0, bottom: 0, backgroundColor: '#ffffff' },
  ivNumber: { width: 24, color: '#ff9700', fontSize: 16, textAlign: 'right' },
  preferencePanel: { width: '94%', marginTop: 14, gap: 4, padding: 10, borderWidth: 1, borderRadius: 12 },
  preferenceTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  metaPanel: { width: '94%', marginTop: 14, paddingVertical: 8, borderRadius: 10 },
  notice: { width: '94%', marginTop: 10, padding: 10, borderWidth: 1, borderColor: '#338b6b', borderRadius: 10, backgroundColor: '#102e26' },
  noticeText: { color: '#9ff0ca', fontWeight: '700', textAlign: 'center' },
  saveError: { width: '94%', marginTop: 10, padding: 10, borderWidth: 1, borderColor: '#b65b70', borderRadius: 10, backgroundColor: '#3b1722' },
  saveErrorText: { color: '#ffd1da', fontWeight: '700', textAlign: 'center' },
  closeButton: { position: 'absolute', bottom: 18, left: '50%', zIndex: 20, width: 64, height: 64, marginLeft: -32 },
  closeImage: { width: 64, height: 64 },
});
