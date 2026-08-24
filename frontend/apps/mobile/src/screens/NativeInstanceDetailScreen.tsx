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
  onNext?: () => void;
  onPrevious?: () => void;
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
  if (detail.row.lucky || instance?.lucky || (instance?.is_wanted && instance.pref_lucky)) {
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

const friendshipLevelFor = (detail: NativeInstanceDetail): number => {
  const stored = Number(detail.instance?.friendship_level);
  if (Number.isFinite(stored)) return Math.max(0, Math.min(5, Math.trunc(stored)));
  const summary = detail.preferences.find((row) => row.label === 'Friendship')?.value;
  const parsed = Number.parseInt(summary ?? '0', 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(5, parsed)) : 0;
};

const FriendshipConditions = ({
  assetBaseUrl,
  detail,
  palette,
  onEdit,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail;
  palette: typeof LIGHT;
  onEdit: () => void;
}) => {
  const friendship = friendshipLevelFor(detail);
  const luckyRequested = Boolean(detail.instance?.pref_lucky)
    || detail.preferences.some((row) => row.label === 'Lucky trade');
  return (
    <View style={[styles.conditionsPanel, { backgroundColor: palette.panel, borderColor: palette.border }]}>
      <View style={styles.conditionsHeadingRow}>
        <Pressable
          accessibilityLabel="Edit wanted listing"
          accessibilityRole="button"
          onPress={onEdit}
          style={styles.conditionEditButton}
        >
          <Image
            accessibilityElementsHidden
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/edit-icon.png') }}
            style={[styles.conditionEditImage, { tintColor: palette.text }]}
          />
        </Pressable>
        <View style={styles.conditionsHeadingCopy}>
          <Text style={styles.conditionsTitle}>WANTED CONDITIONS</Text>
          <Text style={[styles.conditionsSubtitle, { color: palette.secondary }]}>Friendship and eligibility</Text>
        </View>
        <View style={[styles.priorityBadge, detail.row.mostWanted && styles.priorityBadgeActive]}>
          <Text style={[styles.priorityBadgeText, detail.row.mostWanted && styles.priorityBadgeTextActive]}>
            {detail.row.mostWanted ? '★ Most Wanted' : '☆ Most Wanted'}
          </Text>
        </View>
      </View>

      <View
        accessibilityLabel={`${friendship} of 5 friendship hearts`}
        style={styles.friendshipIcons}
      >
        <View style={styles.hearts}>
          {Array.from({ length: 5 }, (_, index) => (
            <Image
              accessibilityElementsHidden
              key={index}
              resizeMode="contain"
              source={{
                uri: toAssetUrl(
                  assetBaseUrl,
                  `/images/${index < friendship ? 'heart-filled' : 'heart-unfilled'}.png`,
                ),
              }}
              style={styles.heart}
            />
          ))}
        </View>
        <Image
          accessibilityLabel={luckyRequested ? 'Lucky trade requested' : 'Lucky trade not requested'}
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky_friend_icon.png') }}
          style={[styles.friendshipBadgeIcon, !luckyRequested && styles.inactiveConditionIcon]}
        />
        <Image
          accessibilityLabel={friendship >= 5 ? 'Remote trade available' : 'Remote trade unavailable'}
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/remote_trade_icon.png') }}
          style={[
            styles.remoteTradeIcon,
            { tintColor: palette.text },
            friendship < 5 && styles.inactiveConditionIcon,
          ]}
        />
      </View>

      <View style={styles.friendshipStatus}>
        <View style={[styles.conditionChip, { borderColor: palette.border }]}>
          <Text style={[styles.conditionChipText, { color: palette.secondary }]}>
            {friendship === 5 ? 'Remote trade available' : `${friendship}/5 hearts`}
          </Text>
        </View>
        <View style={[styles.conditionChip, { borderColor: palette.border }]}>
          <Text style={[styles.conditionChipText, { color: palette.secondary }]}>
            {luckyRequested
              ? 'Lucky trade requested'
              : friendship >= 4
                ? 'Lucky Friends eligible'
                : 'Lucky unlocks at 4 hearts'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const TargetCard = ({
  assetBaseUrl,
  row,
  palette,
}: {
  assetBaseUrl: string;
  row: NativeInstanceDetail['row'];
  palette: typeof LIGHT;
}) => (
  <View style={[styles.targetCard, { borderColor: palette.border, backgroundColor: palette.targetCard }]}>
    <View style={styles.targetImageStage}>
      {row.lucky ? (
        <Image
          accessibilityElementsHidden
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky.png') }}
          style={styles.targetLuckyBackdrop}
        />
      ) : null}
      {row.imageUri ? (
        <Image
          accessibilityLabel={row.name}
          resizeMode="contain"
          source={{ uri: row.imageUri }}
          style={styles.targetImage}
        />
      ) : null}
      {row.maxKind ? (
        <Image
          accessibilityLabel={row.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, `/images/${row.maxKind}.png`) }}
          style={styles.targetMaxBadge}
        />
      ) : null}
    </View>
    <Text numberOfLines={3} style={[styles.targetName, { color: palette.text }]}>{row.name}</Text>
    <Text style={[styles.targetDex, { color: palette.secondary }]}>#{String(row.pokedexNumber).padStart(4, '0')}</Text>
  </View>
);

const TargetSummary = ({
  assetBaseUrl,
  detail,
  palette,
  onEdit,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail;
  palette: typeof LIGHT;
  onEdit: () => void;
}) => {
  const rows = detail.targetRows ?? [];
  if (detail.row.status === 'caught') return null;
  return (
    <View
      style={[
        styles.targetsPanel,
        {
          borderColor: detail.row.status === 'wanted' ? '#98505e' : '#3f8068',
          backgroundColor: palette.targetPanel,
        },
      ]}
    >
      <View style={styles.targetsHeading}>
        <Text style={[styles.targetsTitle, { color: palette.text }]}>
          {detail.row.status === 'wanted' ? 'For Trade Pokémon' : 'Wanted Pokémon'}
        </Text>
        <View style={[styles.targetCount, { backgroundColor: detail.row.status === 'wanted' ? '#75404a' : '#2d6a51' }]}>
          <Text style={styles.targetCountText}>{rows.length}</Text>
        </View>
      </View>
      {rows.length > 0 ? (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator
          style={styles.targetGridViewport}
        >
          <View style={styles.targetGrid}>
            {rows.map((row) => (
              <TargetCard assetBaseUrl={assetBaseUrl} key={row.id} palette={palette} row={row} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={[styles.noTargets, { color: palette.secondary }]}>No matching targets are configured.</Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={onEdit}
        style={[
          styles.editPreferencesButton,
          { backgroundColor: detail.row.status === 'wanted' ? '#873e50' : '#258758' },
        ]}
      >
        <Text style={styles.editPreferencesText}>Edit preferences</Text>
      </Pressable>
    </View>
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
  onNext,
  onPrevious,
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
  const isCaught = detail.row.status === 'caught';
  const isTrade = detail.row.status === 'trade';
  const isWanted = detail.row.status === 'wanted';
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

          {isWanted ? (
            <FriendshipConditions
              assetBaseUrl={assetBaseUrl}
              detail={detail}
              onEdit={onEditInCurrentApp}
              palette={palette}
            />
          ) : (
            <View style={styles.headerRow}>
              <Pressable
                accessibilityLabel="Edit Pokémon"
                accessibilityRole="button"
                onPress={onEditInCurrentApp}
                style={styles.iconButton}
              >
                <Image
                  accessibilityElementsHidden
                  resizeMode="contain"
                  source={{ uri: toAssetUrl(assetBaseUrl, '/images/edit-icon.png') }}
                  style={[styles.editImage, { tintColor: palette.text }]}
                />
              </Pressable>
              {isCaught && cp != null ? (
                <Text style={[styles.cpText, { color: palette.text }]}>CP{cp}</Text>
              ) : <View />}
              {isCaught ? (
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
              ) : <View style={styles.iconButton} />}
            </View>
          )}

          {isCaught && showArc ? (
            <View style={styles.arc}>
              <LevelArc level={level} />
            </View>
          ) : null}

          <View style={[
            styles.imageStage,
            isWanted && styles.wantedImageStage,
            isTrade && styles.tradeImageStage,
          ]}>
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
                style={[styles.luckyBackdrop, !isCaught && styles.compactLuckyBackdrop]}
              />
            ) : null}
            {detail.row.imageUri ? (
              <Image
                accessibilityLabel={detail.row.name}
                resizeMode="contain"
                source={{ uri: detail.row.imageUri }}
                style={[styles.pokemonImage, !isCaught && styles.compactPokemonImage]}
              />
            ) : null}
            {maxBadge ? (
              <Image
                accessibilityLabel={detail.row.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
                resizeMode="contain"
                source={{ uri: maxBadge }}
                style={[styles.maxBadge, !isCaught && styles.compactMaxBadge]}
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

          <View style={[
            styles.detailsPanel,
            !isCaught && styles.compactDetailsPanel,
            { backgroundColor: palette.panel },
          ]}>
            {statusLabel ? (
              <Text style={[styles.statusEyebrow, { color: status.accent }]}>{statusLabel}</Text>
            ) : null}
            <Text accessibilityRole="header" style={[styles.name, { color: palette.text }]}>
              {detail.row.name}
            </Text>

            {isCaught || gender ? (
              <View style={styles.levelGenderRow}>
                <View style={styles.sideSlot} />
                {isCaught && showArc ? (
                  <Text style={[styles.levelText, { color: palette.secondary }]}>LEVEL: {level}</Text>
                ) : <View />}
                <Text style={[styles.genderText, { color: gender === 'Female' ? '#ff3b87' : '#30a7ff' }]}>
                  {gender === 'Female' ? '♀' : gender === 'Male' ? '♂' : ''}
                </Text>
              </View>
            ) : null}

            {isCaught && showPhysicalRow ? (
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

            {isCaught && detail.ivs.length ? (
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

            {!isWanted && detail.preferences.length ? (
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

            <TargetSummary
              assetBaseUrl={assetBaseUrl}
              detail={detail}
              onEdit={onEditInCurrentApp}
              palette={palette}
            />

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
      {onPrevious ? (
        <Pressable
          accessibilityLabel="Previous Pokémon"
          accessibilityRole="button"
          onPress={onPrevious}
          style={[styles.instanceNavigation, styles.previousInstance]}
        >
          <Text style={styles.instanceNavigationIcon}>◀</Text>
        </Pressable>
      ) : null}
      {onNext ? (
        <Pressable
          accessibilityLabel="Next Pokémon"
          accessibilityRole="button"
          onPress={onNext}
          style={[styles.instanceNavigation, styles.nextInstance]}
        >
          <Text style={styles.instanceNavigationIcon}>▶</Text>
        </Pressable>
      ) : null}
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
  targetCard: '#152321',
  targetPanel: '#313333',
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
  targetCard: '#eef6f2',
  targetPanel: '#f0f5f2',
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
  editImage: { width: 42, height: 42 },
  cpText: { paddingTop: 3, fontSize: 18, fontWeight: '500' },
  favoriteIcon: { color: '#ffffff', fontSize: 48, lineHeight: 50, fontWeight: '300' },
  favoriteSelected: { color: '#ffd000' },
  wantedBadge: { minHeight: 40, justifyContent: 'center', marginTop: 1, paddingHorizontal: 12, borderWidth: 1, borderColor: '#8b9997', borderRadius: 999, backgroundColor: 'rgba(53,61,61,0.82)' },
  mostWantedBadge: { borderColor: '#ff704d' },
  wantedBadgeText: { color: '#c5cdcb', fontSize: 12, fontWeight: '900' },
  mostWantedBadgeText: { color: '#ff8a63' },
  conditionsPanel: {
    zIndex: 8,
    width: '94%',
    gap: 5,
    marginBottom: 3,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  conditionsHeadingRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  conditionEditButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionEditImage: { width: 35, height: 35 },
  conditionsHeadingCopy: { flex: 1, minWidth: 0, gap: 2 },
  conditionsTitle: { color: '#ff617d', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  conditionsSubtitle: { fontSize: 11, lineHeight: 13 },
  priorityBadge: {
    minHeight: 38,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#77817f',
    borderRadius: 999,
    backgroundColor: 'rgba(53,61,61,0.72)',
  },
  priorityBadgeActive: { borderColor: '#ff704d', backgroundColor: 'rgba(255,112,77,0.10)' },
  priorityBadgeText: { color: '#aab4b2', fontSize: 11, fontWeight: '900' },
  priorityBadgeTextActive: { color: '#ff815d' },
  friendshipIcons: {
    minHeight: 38,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hearts: { flexDirection: 'row', flexWrap: 'nowrap' },
  heart: { width: 30, height: 30 },
  friendshipBadgeIcon: { width: 43, height: 43, marginLeft: 3 },
  remoteTradeIcon: { width: 39, height: 39, marginLeft: 2 },
  inactiveConditionIcon: { opacity: 0.32 },
  friendshipStatus: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  conditionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(239,91,113,0.08)',
  },
  conditionChipText: { fontSize: 11 },
  arc: { position: 'absolute', zIndex: 1, top: 48, alignSelf: 'center' },
  imageStage: { zIndex: 3, width: 272, height: 272, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  wantedImageStage: { width: 194, height: 194, marginTop: 0 },
  tradeImageStage: { width: 220, height: 220, marginTop: 4 },
  locationBackdrop: { position: 'absolute', top: -20, height: 292 },
  luckyBackdrop: { position: 'absolute', zIndex: 2, width: 272, height: 272 },
  compactLuckyBackdrop: { width: 205, height: 205 },
  pokemonImage: { zIndex: 4, width: 267, height: 267 },
  compactPokemonImage: { width: 190, height: 190 },
  maxBadge: { position: 'absolute', zIndex: 5, top: 5, right: 5, width: 92, height: 92 },
  compactMaxBadge: { top: 2, right: 2, width: 58, height: 58 },
  purifiedBadge: { position: 'absolute', zIndex: 5, bottom: 5, left: 5, width: 54, height: 54 },
  detailsPanel: { width: '100%', minHeight: 300, alignItems: 'center', marginTop: -36, paddingTop: 64, paddingBottom: 18, borderRadius: 12, overflow: 'hidden' },
  compactDetailsPanel: { marginTop: -47, paddingTop: 55 },
  statusEyebrow: { marginBottom: 4, fontSize: 12, fontWeight: '900', letterSpacing: 1.7 },
  name: { maxWidth: '92%', fontSize: 32, lineHeight: 35, fontWeight: '500', textAlign: 'center' },
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
  targetsPanel: {
    width: '94%',
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  targetsHeading: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetsTitle: { flex: 1, fontSize: 16, fontWeight: '900' },
  targetCount: { minWidth: 34, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 13 },
  targetCountText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  targetGridViewport: { maxHeight: 346, marginTop: 5 },
  targetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingBottom: 3 },
  targetCard: {
    width: '31.8%',
    minHeight: 144,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  targetImageStage: { width: '100%', height: 86, alignItems: 'center', justifyContent: 'center' },
  targetLuckyBackdrop: { position: 'absolute', width: 88, height: 88 },
  targetImage: { width: 82, height: 82 },
  targetMaxBadge: { position: 'absolute', top: 0, right: 0, width: 31, height: 31 },
  targetName: { minHeight: 32, fontSize: 12, lineHeight: 15, fontWeight: '900', textAlign: 'center' },
  targetDex: { marginTop: 3, fontSize: 10 },
  noTargets: { paddingVertical: 18, textAlign: 'center' },
  editPreferencesButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderRadius: 10 },
  editPreferencesText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  notice: { width: '94%', marginTop: 10, padding: 10, borderWidth: 1, borderColor: '#338b6b', borderRadius: 10, backgroundColor: '#102e26' },
  noticeText: { color: '#9ff0ca', fontWeight: '700', textAlign: 'center' },
  saveError: { width: '94%', marginTop: 10, padding: 10, borderWidth: 1, borderColor: '#b65b70', borderRadius: 10, backgroundColor: '#3b1722' },
  saveErrorText: { color: '#ffd1da', fontWeight: '700', textAlign: 'center' },
  closeButton: { position: 'absolute', bottom: 18, left: '50%', zIndex: 20, width: 64, height: 64, marginLeft: -32 },
  closeImage: { width: 64, height: 64 },
  instanceNavigation: { position: 'absolute', bottom: 24, zIndex: 19, width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  previousInstance: { left: 0 },
  nextInstance: { right: 0 },
  instanceNavigationIcon: { color: '#ffffff', fontSize: 34, lineHeight: 38, textShadowColor: '#00000088', textShadowRadius: 4 },
});
