import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  type ReactNode,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { PanGestureHandler } from 'react-native-gesture-handler';
import type {
  NativeInstanceBackgroundOption,
  NativeInstanceDetail,
  NativeInstanceMoveOption,
} from '../features/collection/collectionModel';
import type {
  NativeInstanceDetailPatch,
} from '../features/collection/nativeInstanceDetailMutation';
import { NativeUiIcon } from '../components/NativeUiIcon';
import type {
  PokemonSizeClass,
  WantedSizePreferences,
  WantedSizeRange,
} from '@pokemongonexus/shared-contracts/instances';
import { collectionExperienceParityContract } from '@pokemongonexus/shared-ui-tokens';
import {
  NativePokemonLocationBackdrop,
} from '../features/collection/parity/NativePokemonLocationBackdrop';
import {
  useNativeOverlaySwipeNavigation,
} from '../features/collection/parity/useNativeOverlaySwipeNavigation';
import { getNativeLocationSuggestions } from '../services/locationApi';
import { getPokemonLevelArcProgress } from '@pokemongonexus/shared-domain/combat-power';
import {
  getPokemonShadowMoveBonus,
  type PokemonMoveDamageMode,
} from '@pokemongonexus/shared-domain/moves';
import {
  calculateNativeDraftCp,
  firstNativeCombatError,
  validateNativeCombatDraft,
} from '../features/collection/nativeCombatPower';
import {
  useNativeModalAnimation,
  useNativeReducedMotion,
} from '../features/settings/useNativeMotion';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';

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
  onOpenTarget?: (instanceId: string) => void;
  onToggleFavorite: (favorite: boolean) => void;
  /** @deprecated Native editing is handled by onSaveDetails. */
  onEditInCurrentApp?: () => void;
  onEditPreferences?: () => void;
  onSaveDetails?: (patch: NativeInstanceDetailPatch) => Promise<unknown>;
  canEdit?: boolean;
};

type NativeInstanceEditDraft = {
  nickname: string;
  cp: string;
  level: string;
  gender: string | null;
  weight: string;
  height: string;
  attackIv: string;
  defenseIv: string;
  staminaIv: string;
  locationCaught: string;
  dateCaught: string;
  friendship: number;
  prefLucky: boolean;
  mostWanted: boolean;
  fastMove: number | null;
  chargedMove1: number | null;
  chargedMove2: number | null;
  weightSize: PokemonSizeClass | null;
  heightSize: PokemonSizeClass | null;
  locationCard: string | null;
  lucky: boolean;
  isTraded: boolean;
  originalTrainerId: string | null;
  originalTrainerName: string;
  tradedDate: string;
  pokeball: string | null;
  shadow: boolean;
  purified: boolean;
  maxAttack: number | null;
  maxGuard: number | null;
  maxSpirit: number | null;
  megaEnabled: boolean;
  megaForm: string | null;
  crowned: boolean;
  crownForm: string | null;
  fused: boolean;
  fusionId: number | null;
  fusionForm: string | null;
  fusedWith: string | null;
};

const editableNumber = (value: unknown): string => (
  typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
);

// Historic collection rows may contain zero for an unknown physical
// measurement. The canonical overlay treats that as missing metadata, not as
// a literal zero-kilogram or zero-metre Pokémon.
const editablePhysicalMeasurement = (value: unknown): string => (
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? String(value) : ''
);

const resolveWantedSizeClass = (
  detail: NativeInstanceDetail,
  metric: 'weight' | 'height',
): PokemonSizeClass | null => {
  const stored = detail.instance?.wanted_size_preferences?.[metric]?.category;
  if (stored) return stored;
  const value = detail.instance?.[metric];
  const sizes = detail.sizeThresholds;
  if (value == null || value <= 0 || !sizes) return null;
  if (value < sizes[`${metric}_xxs_threshold`]) return 'XXS';
  if (value < sizes[`${metric}_xs_threshold`]) return 'XS';
  if (value > sizes[`${metric}_xxl_threshold`]) return 'XXL';
  if (value > sizes[`${metric}_xl_threshold`]) return 'XL';
  return null;
};

const hasPotentialMaxMoveAccess = (detail: NativeInstanceDetail): boolean => Boolean(
  detail.row.maxKind
  || detail.specialMaxBaseEligible
  || (detail.crownOptions?.length ?? 0) > 0,
);

const createEditDraft = (detail: NativeInstanceDetail): NativeInstanceEditDraft => ({
  nickname: detail.instance?.nickname
    ?? detail.row.name.trim().split(/\s+/).at(-1)
    ?? detail.row.name,
  cp: editableNumber(detail.instance?.cp),
  level: editableNumber(detail.instance?.level),
  gender: detail.instance?.gender ?? null,
  weight: editablePhysicalMeasurement(detail.instance?.weight),
  height: editablePhysicalMeasurement(detail.instance?.height),
  attackIv: editableNumber(detail.instance?.attack_iv),
  defenseIv: editableNumber(detail.instance?.defense_iv),
  staminaIv: editableNumber(detail.instance?.stamina_iv),
  locationCaught: detail.instance?.location_caught ?? '',
  dateCaught: detail.instance?.date_caught?.slice(0, 10) ?? '',
  friendship: friendshipLevelFor(detail),
  prefLucky: Boolean(detail.instance?.pref_lucky),
  mostWanted: Boolean(detail.instance?.most_wanted),
  fastMove: detail.instance?.fast_move_id ?? null,
  chargedMove1: detail.instance?.charged_move1_id ?? null,
  chargedMove2: detail.instance?.charged_move2_id ?? null,
  weightSize: resolveWantedSizeClass(detail, 'weight'),
  heightSize: resolveWantedSizeClass(detail, 'height'),
  locationCard: detail.instance?.location_card ?? null,
  lucky: Boolean(detail.instance?.lucky),
  isTraded: Boolean(detail.instance?.is_traded || detail.instance?.lucky),
  originalTrainerId: detail.instance?.original_trainer_id ?? null,
  originalTrainerName: detail.instance?.original_trainer_name ?? '',
  tradedDate: detail.instance?.traded_date?.slice(0, 10) ?? '',
  pokeball: detail.instance?.pokeball ?? null,
  shadow: Boolean(detail.instance?.shadow && !detail.instance?.purified),
  purified: Boolean(detail.instance?.purified),
  maxAttack: hasPotentialMaxMoveAccess(detail)
    ? Number(detail.instance?.max_attack ?? 1)
    : null,
  maxGuard: hasPotentialMaxMoveAccess(detail)
    ? Number(detail.instance?.max_guard ?? 0)
    : null,
  maxSpirit: hasPotentialMaxMoveAccess(detail)
    ? Number(detail.instance?.max_spirit ?? 0)
    : null,
  megaEnabled: Boolean(detail.instance?.is_mega),
  megaForm: detail.instance?.mega_form ?? detail.megaOptions?.[0]?.form ?? null,
  crowned: Boolean(detail.instance?.crown),
  crownForm: detail.instance?.fusion_form ?? detail.crownOptions?.[0]?.form ?? null,
  fused: Boolean(detail.instance?.is_fused),
  fusionId: detail.instance?.is_fused
    ? detail.fusionOptions?.find((option) => option.name === detail.instance?.fusion_form)?.id ?? null
    : null,
  fusionForm: detail.instance?.is_fused ? detail.instance.fusion_form : null,
  fusedWith: detail.instance?.is_fused ? detail.instance.fused_with : null,
});

const BALL_OPTIONS = [
  ['poke_ball', 'POKÉ BALL'],
  ['great_ball', 'GREAT BALL'],
  ['ultra_ball', 'ULTRA BALL'],
  ['premier_ball', 'PREMIER BALL'],
  ['master_ball', 'MASTER BALL'],
  ['safari_ball', 'SAFARI BALL'],
  ['beast_ball', 'BEAST BALL'],
] as const;

const nullableNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number(trimmed);
};

const buildWantedSizeRange = (
  category: PokemonSizeClass | null,
  sizes: NativeInstanceDetail['sizeThresholds'],
  metric: 'weight' | 'height',
): WantedSizeRange | null => {
  if (!category || !sizes) return null;
  const xxs = sizes[`${metric}_xxs_threshold`];
  const xs = sizes[`${metric}_xs_threshold`];
  const xl = sizes[`${metric}_xl_threshold`];
  const xxl = sizes[`${metric}_xxl_threshold`];
  if (category === 'XXS') {
    return { category, min: null, max: xxs, min_inclusive: false, max_inclusive: false };
  }
  if (category === 'XS') {
    return { category, min: xxs, max: xs, min_inclusive: true, max_inclusive: false };
  }
  if (category === 'XL') {
    return { category, min: xl, max: xxl, min_inclusive: false, max_inclusive: true };
  }
  return { category, min: xxl, max: null, min_inclusive: false, max_inclusive: false };
};

const buildWantedSizePreferences = (
  draft: NativeInstanceEditDraft,
  sizes: NativeInstanceDetail['sizeThresholds'],
): WantedSizePreferences | null => {
  const preferences = {
    weight: buildWantedSizeRange(draft.weightSize, sizes, 'weight'),
    height: buildWantedSizeRange(draft.heightSize, sizes, 'height'),
  };
  return preferences.weight || preferences.height ? preferences : null;
};

const toAssetUrl = (baseUrl: string, path: string): string => (
  /^https?:\/\//i.test(path)
    ? path
    : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
);

const primaryTypeName = (
  detail: NativeInstanceDetail,
  typeIconUris = detail.row.typeIconUris,
): string => {
  const match = typeIconUris[0]?.match(/\/([^/?]+)\.png(?:\?|$)/i);
  return match?.[1]?.toLowerCase() ?? 'normal';
};

const typeNamesFromIconUris = (typeIconUris: string[]): string[] => (
  typeIconUris.map((uri) => uri.match(/\/([^/?]+)\.png(?:\?|$)/i)?.[1]?.toLowerCase() ?? 'unknown')
);

const pokemonTypesAccessibilityLabel = (typeIconUris: string[]): string => (
  `Pokémon types: ${typeNamesFromIconUris(typeIconUris).join(' and ') || 'unknown'}`
);

const pokemonTypesTestId = (typeIconUris: string[]): string => (
  `native-instance-types-${typeNamesFromIconUris(typeIconUris).join('-') || 'unknown'}`
);

const backgroundPath = (
  detail: NativeInstanceDetail,
  overrides?: {
    lucky?: boolean;
    shadow?: boolean;
    purified?: boolean;
    typeIconUris?: string[];
  },
): string => {
  const instance = detail.instance;
  const shadow = overrides?.shadow ?? instance?.shadow;
  const purified = overrides?.purified ?? instance?.purified;
  if (shadow && !purified) return '/images/backgrounds/bg_shadow.png';
  const canonicalLucky = Boolean(
    detail.row.lucky || instance?.lucky || (instance?.is_wanted && instance.pref_lucky),
  );
  if (overrides?.lucky ?? canonicalLucky) {
    return '/images/backgrounds/bg_lucky.png';
  }
  return `/images/backgrounds/bg_${primaryTypeName(detail, overrides?.typeIconUris)}.png`;
};

const STATUS = {
  caught: { accent: '#58c7eb', label: null },
  trade: { accent: '#53d39a', label: 'FOR TRADE' },
  wanted: { accent: '#ff7189', label: 'WANTED' },
} as const;

const LIGHT_STATUS = {
  caught: { accent: '#005bb5', label: null },
  trade: { accent: '#087454', label: 'FOR TRADE' },
  wanted: { accent: '#b0003b', label: 'WANTED' },
} as const;

const LevelArc = ({ level }: { level: number }) => {
  const angle = Math.PI - getPokemonLevelArcProgress(level) * Math.PI;
  const pointX = 150 + (126 * Math.cos(angle));
  const pointY = 136 - (126 * Math.sin(angle));
  return (
    <Svg height={146} viewBox="0 0 300 146" width={300}>
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
  editing,
  draft,
  onDraftChange,
  canPickBackground,
  onOpenBackground,
  canEdit,
  accent,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail;
  palette: typeof LIGHT;
  onEdit: () => void;
  editing: boolean;
  draft: NativeInstanceEditDraft;
  onDraftChange: (patch: Partial<NativeInstanceEditDraft>) => void;
  canPickBackground: boolean;
  onOpenBackground: () => void;
  canEdit: boolean;
  accent: string;
}) => {
  const friendship = editing ? draft.friendship : friendshipLevelFor(detail);
  const luckyRequested = editing
    ? draft.prefLucky
    : Boolean(detail.instance?.pref_lucky)
      || detail.preferences.some((row) => row.label === 'Lucky trade');
  const mostWanted = editing ? draft.mostWanted : detail.row.mostWanted;
  return (
    <View style={[styles.conditionsPanel, { backgroundColor: palette.panel, borderColor: palette.border }]}>
      <View style={styles.conditionsHeadingRow}>
        {canEdit ? (
          <Pressable
            accessibilityLabel={editing ? 'Save wanted listing' : 'Edit wanted listing'}
            accessibilityRole="button"
            onPress={onEdit}
            style={styles.conditionEditButton}
          >
            <Image fadeDuration={0}
              accessibilityElementsHidden
              resizeMode="contain"
              source={{ uri: toAssetUrl(assetBaseUrl, editing ? '/images/save-icon.png' : '/images/edit-icon.png') }}
              style={[styles.conditionEditImage, { tintColor: palette.text }]}
            />
          </Pressable>
        ) : null}
        <View style={styles.conditionsHeadingCopy}>
          <Text style={[styles.conditionsTitle, { color: accent }]}>WANTED CONDITIONS</Text>
          <Text style={[styles.conditionsSubtitle, { color: palette.secondary }]}>Friendship and eligibility</Text>
        </View>
        {editing && canPickBackground ? (
          <Pressable
            accessibilityLabel="Choose location background"
            accessibilityRole="button"
            onPress={onOpenBackground}
            style={styles.conditionBackgroundButton}
          >
            <Image fadeDuration={0}
              accessibilityElementsHidden
              resizeMode="contain"
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/location.png') }}
              style={[styles.conditionBackgroundImage, { tintColor: palette.text }]}
            />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={mostWanted ? 'Remove Most Wanted' : 'Mark as Most Wanted'}
          accessibilityRole="button"
          disabled={!editing}
          onPress={() => onDraftChange({ mostWanted: !mostWanted })}
          style={[styles.priorityBadge, mostWanted && styles.priorityBadgeActive]}
        >
          <Text style={[styles.priorityBadgeText, mostWanted && styles.priorityBadgeTextActive]}>
            {mostWanted ? '★ Most Wanted' : '☆ Most Wanted'}
          </Text>
        </Pressable>
      </View>

      <View
        accessibilityLabel={`${friendship} of 5 friendship hearts`}
        style={styles.friendshipIcons}
      >
        <View style={styles.hearts}>
          {Array.from({ length: 5 }, (_, index) => (
            <Pressable
              accessibilityLabel={`Set friendship to ${index + 1} hearts`}
              accessibilityRole="button"
              disabled={!editing}
              key={index}
              onPress={() => onDraftChange({ friendship: index + 1 })}
            >
              <Image fadeDuration={0}
                accessibilityElementsHidden
                resizeMode="contain"
                source={{
                  uri: toAssetUrl(
                    assetBaseUrl,
                    `/images/${index < friendship ? 'heart-filled' : 'heart-unfilled'}.png`,
                  ),
                }}
                style={styles.heart}
              />
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityLabel={luckyRequested ? 'Lucky trade requested' : 'Lucky trade not requested'}
          accessibilityRole="button"
          disabled={!editing}
          onPress={() => onDraftChange({ prefLucky: !luckyRequested })}
        >
          <Image fadeDuration={0}
            accessibilityElementsHidden
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky_friend_icon.png') }}
            style={[styles.friendshipBadgeIcon, !luckyRequested && styles.inactiveConditionIcon]}
          />
        </Pressable>
        <Image fadeDuration={0}
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
  onPress,
}: {
  assetBaseUrl: string;
  row: NativeInstanceDetail['row'];
  palette: typeof LIGHT;
  onPress?: () => void;
}) => (
  <Pressable
    accessibilityLabel={`Open ${row.name}`}
    accessibilityRole={onPress ? 'button' : undefined}
    disabled={!onPress}
    onPress={onPress}
    style={({ pressed }) => [
      styles.targetCard,
      { borderColor: palette.border, backgroundColor: palette.targetCard },
      pressed && styles.targetCardPressed,
    ]}
  >
    <View style={styles.targetImageStage}>
      {row.lucky ? (
        <Image fadeDuration={0}
          accessibilityElementsHidden
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky.png') }}
          style={styles.targetLuckyBackdrop}
        />
      ) : null}
      {row.imageUri ? (
        <Image fadeDuration={0}
          accessibilityLabel={row.name}
          resizeMode="contain"
          source={{ uri: row.imageUri }}
          style={styles.targetImage}
        />
      ) : null}
      {row.maxKind ? (
        <Image fadeDuration={0}
          accessibilityLabel={row.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
          resizeMode="contain"
          source={{ uri: toAssetUrl(assetBaseUrl, `/images/${row.maxKind}.png`) }}
          style={styles.targetMaxBadge}
        />
      ) : null}
    </View>
    <Text numberOfLines={3} style={[styles.targetName, { color: palette.text }]}>{row.name}</Text>
    <Text style={[styles.targetDex, { color: palette.secondary }]}>#{String(row.pokedexNumber).padStart(4, '0')}</Text>
  </Pressable>
);

const TargetSummary = ({
  assetBaseUrl,
  detail,
  palette,
  onEdit,
  onOpenTarget,
  canEdit,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail;
  palette: typeof LIGHT;
  onEdit: () => void;
  onOpenTarget?: (instanceId: string) => void;
  canEdit: boolean;
}) => {
  const rows = detail.targetRows ?? [];
  if (detail.row.status === 'caught') return null;
  return (
    <>
      <View
        style={[
          styles.targetsPanel,
          detail.row.status === 'trade' && styles.targetsPanelTrade,
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
          <View style={[styles.targetGridViewport, styles.targetGrid]} testID="native-instance-target-list">
            {rows.map((row) => (
              <TargetCard
                assetBaseUrl={assetBaseUrl}
                key={row.id}
                onPress={onOpenTarget ? () => onOpenTarget(row.id) : undefined}
                palette={palette}
                row={row}
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.noTargets, { color: palette.secondary }]}>No matching targets are configured.</Text>
        )}
      </View>
      {canEdit ? (
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={[
            styles.editPreferencesButton,
            { backgroundColor: detail.row.status === 'wanted' ? '#f25770' : '#31b777' },
          ]}
        >
          <Text style={styles.editPreferencesText}>Edit preferences</Text>
        </Pressable>
      ) : null}
    </>
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

const NativeMoveModeTabs = ({
  mode,
  onChange,
  palette,
}: {
  mode: PokemonMoveDamageMode;
  onChange: (mode: PokemonMoveDamageMode) => void;
  palette: typeof LIGHT;
}) => (
  <View accessibilityLabel="Move battle mode" accessibilityRole="tablist" style={styles.moveTabs}>
    {([
      ['raid', 'GYMS & RAIDS'],
      ['pvp', 'TRAINER BATTLES'],
    ] as const).map(([value, label]) => {
      const selected = mode === value;
      return (
        <Pressable
          aria-selected={selected}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          key={value}
          onPress={() => onChange(value)}
          style={styles.moveTabButton}
        >
          <Text style={[selected ? styles.moveTabActive : styles.moveTab, {
            color: selected ? palette.text : palette.secondary,
            borderBottomColor: selected ? palette.text : 'transparent',
          }]}
          >
            {label}
          </Text>
        </Pressable>
      );
    })}
  </View>
);

const NativeMovesPanel = ({
  assetBaseUrl,
  isShadow,
  moves,
  palette,
}: {
  assetBaseUrl: string;
  isShadow: boolean;
  moves: NativeInstanceDetail['moves'];
  palette: typeof LIGHT;
}) => {
  const reduceMotion = useNativeReducedMotion();
  const [mode, setMode] = useState<PokemonMoveDamageMode>('raid');
  const [slide] = useState(() => new Animated.Value(0));
  const changeMode = (nextMode: PokemonMoveDamageMode) => {
    if (nextMode === mode) return;
    slide.stopAnimation();
    setMode(nextMode);
    if (reduceMotion) {
      slide.setValue(0);
      return;
    }
    slide.setValue(nextMode === 'pvp' ? 18 : -18);
    Animated.timing(slide, {
      duration: 220,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View accessibilityLabel="Pokémon moves" style={styles.nativeMovesPanel}>
      <NativeMoveModeTabs mode={mode} onChange={changeMode} palette={palette} />
      <Animated.View style={{ transform: [{ translateX: slide }] }}>
        {moves.map((move) => {
          const power = mode === 'raid' ? move.raidPower : move.pvpPower;
          const shadowBonus = isShadow && power != null
            ? getPokemonShadowMoveBonus(power)
            : null;
          return (
            <View key={move.label} style={styles.nativeMoveBlock}>
              <View accessibilityLabel={`${move.label}: ${move.value}`} style={styles.nativeMoveRow}>
                <View style={styles.nativeMoveIdentity}>
                  {move.typeIconUri ? (
                    <Image fadeDuration={0}
                      accessibilityLabel={`${move.typeName ?? 'Normal'} type`}
                      source={{ uri: move.typeIconUri }}
                      style={styles.nativeMoveTypeIcon}
                    />
                  ) : null}
                  <Text numberOfLines={1} style={[styles.nativeMoveName, { color: palette.text }]}>
                    {move.value}{move.legacy ? '*' : ''}
                  </Text>
                </View>
                <Text style={[styles.nativeMovePower, { color: palette.text }]}>
                  {power ?? '-'}
                  {shadowBonus != null ? <Text style={styles.nativeMovePowerBonus}>+{shadowBonus}</Text> : null}
                </Text>
              </View>
              {isShadow ? (
                <View accessibilityLabel="Shadow bonus" style={styles.nativeShadowBonusRow}>
                  <View style={styles.nativeShadowBonusIconBadge}>
                    <Image fadeDuration={0}
                      accessibilityElementsHidden
                      source={{ uri: toAssetUrl(assetBaseUrl, '/media/images/shadow_icon.png') }}
                      style={styles.nativeShadowBonusIcon}
                    />
                  </View>
                  <Text style={styles.nativeShadowBonusText}>SHADOW BONUS</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const NativeMoveSelector = ({
  damageMode,
  label,
  options,
  palette,
  value,
  onChange,
}: {
  damageMode: PokemonMoveDamageMode;
  label: string;
  options: NonNullable<NativeInstanceDetail['moveOptions']>;
  palette: typeof LIGHT;
  value: number | null;
  onChange: (value: number | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const animationType = useNativeModalAnimation('slide');
  const selected = options.find((option) => option.id === value);
  const selectorTestId = `native-move-selector-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <>
      <Pressable
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.choiceField, { backgroundColor: palette.input, borderColor: palette.border }]}
        testID={selectorTestId}
      >
        {selected?.typeIconUri ? (
          <Image fadeDuration={0}
            accessibilityLabel={`${selected.typeName} type`}
            source={{ uri: selected.typeIconUri }}
            style={styles.choiceFieldTypeIcon}
          />
        ) : null}
        <View style={styles.choiceFieldCopy}>
          <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>{label.toUpperCase()}</Text>
          <Text numberOfLines={1} style={[styles.choiceFieldValue, { color: palette.text }]}>
            {selected?.name ?? 'Unselected move'}
          </Text>
        </View>
        <Text style={[styles.choiceFieldPower, { color: palette.text }]}>
          {selected ? (damageMode === 'raid' ? selected.raidPower : selected.pvpPower) ?? '-' : ''}
        </Text>
        <Text style={[styles.choiceChevron, { color: palette.secondary }]}>⌄</Text>
      </Pressable>
      <Modal
        animationType={animationType}
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
        transparent
        visible={open}
      >
        <View accessibilityViewIsModal style={styles.choiceModalBackdrop}>
          <View style={[styles.choiceModalSheet, { backgroundColor: palette.panel, borderColor: palette.border }]}>
            <View style={styles.choiceModalHeader}>
              <View>
                <Text style={styles.choiceModalEyebrow}>MOVE SELECTOR</Text>
                <Text style={[styles.choiceModalTitle, { color: palette.text }]}>{label}</Text>
              </View>
              <Pressable
                accessibilityLabel={`Close ${label.toLowerCase()} selector`}
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={[styles.choiceModalClose, { borderColor: palette.border }]}
              >
                <Text style={[styles.choiceModalCloseText, { color: palette.text }]}>×</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.choiceList}>
              <Pressable
                accessibilityRole="button"
                onPress={() => { onChange(null); setOpen(false); }}
                style={[styles.choiceOption, { borderColor: palette.border }]}
              >
                <Text style={[styles.choiceOptionName, { color: palette.text }]}>Unselected move</Text>
              </Pressable>
              {options.map((option) => (
                <Pressable
                  accessibilityRole="button"
                  key={option.id}
                  onPress={() => { onChange(option.id); setOpen(false); }}
                  style={[
                    styles.choiceOption,
                    { borderColor: value === option.id ? '#2e9eff' : palette.border },
                    value === option.id && styles.choiceOptionSelected,
                  ]}
                >
                  {option.typeIconUri ? (
                    <Image fadeDuration={0}
                      accessibilityLabel={`${option.typeName} type`}
                      source={{ uri: option.typeIconUri }}
                      style={styles.choiceOptionTypeIcon}
                    />
                  ) : null}
                  <View style={styles.choiceOptionCopy}>
                    <Text style={[styles.choiceOptionName, { color: palette.text }]}>{option.name}</Text>
                    <Text style={[styles.choiceOptionMeta, { color: palette.secondary }]}>
                      {option.typeName}{option.legacy ? ' · Legacy' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.choiceOptionPower, { color: palette.text }]}>
                    {(damageMode === 'raid' ? option.raidPower : option.pvpPower) ?? '-'}
                  </Text>
                  {value === option.id ? <Text style={styles.choiceCheck}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const NativeWantedSizeControls = ({
  draft,
  palette,
  onChange,
}: {
  draft: NativeInstanceEditDraft;
  palette: typeof LIGHT;
  onChange: (patch: Partial<NativeInstanceEditDraft>) => void;
}) => (
  <View style={styles.editFieldGroup}>
    {([
      ['WEIGHT', 'weightSize'],
      ['HEIGHT', 'heightSize'],
    ] as const).map(([label, field]) => (
      <View key={field} style={styles.sizePreferenceRow}>
        <Text style={[styles.editFieldLabel, styles.sizePreferenceLabel, { color: palette.secondary }]}>{label}</Text>
        <View accessibilityLabel={`Wanted ${label.toLowerCase()}`} style={styles.sizeOptions}>
          {(['XXS', 'XS', null, 'XL', 'XXL'] as const).map((option) => {
            const selected = draft[field] === option;
            const optionLabel = option ?? 'Any';
            return (
              <Pressable
                accessibilityLabel={`${optionLabel} ${label.toLowerCase()}`}
                accessibilityRole="button"
                key={optionLabel}
                onPress={() => onChange({ [field]: option })}
                style={[
                  styles.sizeOption,
                  { borderColor: selected ? '#ff617d' : palette.border },
                  selected && styles.sizeOptionSelected,
                ]}
              >
                <Text style={[styles.sizeOptionText, { color: palette.text }]}>{optionLabel}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    ))}
  </View>
);

const NativeBackgroundPicker = ({
  assetBaseUrl,
  open,
  options,
  palette,
  selectedId,
  onChange,
  onClose,
}: {
  assetBaseUrl: string;
  open: boolean;
  options: NativeInstanceBackgroundOption[];
  palette: typeof LIGHT;
  selectedId: string | null;
  onChange: (value: string | null) => void;
  onClose: () => void;
}) => {
  const animationType = useNativeModalAnimation('slide');
  return (
  <Modal
    animationType={animationType}
    onRequestClose={onClose}
    statusBarTranslucent
    transparent
    visible={open}
  >
    <View accessibilityViewIsModal style={styles.choiceModalBackdrop}>
      <View style={[styles.choiceModalSheet, { backgroundColor: palette.panel, borderColor: palette.border }]}>
        <View style={styles.choiceModalHeader}>
          <View>
            <Text style={styles.choiceModalEyebrow}>LOCATION CARD</Text>
            <Text style={[styles.choiceModalTitle, { color: palette.text }]}>Choose a background</Text>
          </View>
          <Pressable
            accessibilityLabel="Close background selector"
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.choiceModalClose, { borderColor: palette.border }]}
          >
            <Text style={[styles.choiceModalCloseText, { color: palette.text }]}>×</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.backgroundGrid}>
          <Pressable
            accessibilityLabel="No location background"
            accessibilityRole="button"
            onPress={() => { onChange(null); onClose(); }}
            style={[
              styles.backgroundOption,
              { backgroundColor: palette.input, borderColor: selectedId == null ? '#38a9ff' : palette.border },
            ]}
          >
            <Image fadeDuration={0}
              accessibilityElementsHidden
              resizeMode="contain"
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/location.png') }}
              style={[styles.noBackgroundIcon, { tintColor: palette.secondary }]}
            />
            <Text style={[styles.backgroundOptionName, { color: palette.text }]}>None</Text>
          </Pressable>
          {options.map((option) => (
            <Pressable
              accessibilityLabel={`Use ${option.name} background`}
              accessibilityRole="button"
              key={option.id}
              onPress={() => { onChange(String(option.id)); onClose(); }}
              style={[
                styles.backgroundOption,
                { borderColor: selectedId === String(option.id) ? '#38a9ff' : palette.border },
              ]}
            >
              <NativePokemonLocationBackdrop uri={option.imageUri} />
              <View style={styles.backgroundOptionCaption}>
                <Text numberOfLines={2} style={[styles.backgroundOptionName, styles.backgroundOptionImageName]}>
                  {option.name}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
  );
};

const NativeToggleGroup = ({
  label,
  options,
  palette,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: boolean; disabled?: boolean }[];
  palette: typeof LIGHT;
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <View style={styles.editFieldGroup}>
    <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>{label}</Text>
    <View accessibilityLabel={label} style={styles.booleanOptions}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityLabel={`${label}: ${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: option.disabled, selected }}
            disabled={option.disabled}
            key={option.label}
            onPress={() => onChange(option.value)}
            style={[
              styles.booleanOption,
              { borderColor: selected ? '#38a9ff' : palette.border },
              selected && styles.booleanOptionSelected,
              option.disabled && styles.disabledOption,
            ]}
          >
            <Text style={[styles.booleanOptionText, { color: palette.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const NativeCaughtMetadataControls = ({
  detail,
  draft,
  isCaught,
  palette,
  onChange,
  onRequestLocationVisibility,
}: {
  detail: NativeInstanceDetail;
  draft: NativeInstanceEditDraft;
  isCaught: boolean;
  palette: typeof LIGHT;
  onChange: (patch: Partial<NativeInstanceEditDraft>) => void;
  onRequestLocationVisibility: (target: number) => void;
}) => {
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [locationSuggestionError, setLocationSuggestionError] = useState<string | null>(null);
  const [isLoadingLocationSuggestions, setIsLoadingLocationSuggestions] = useState(false);
  const locationRequestRef = useRef(0);
  const locationInputTargetRef = useRef<number | null>(null);
  const acceptedLocationRef = useRef<string | null>(null);
  const inputStyle = [
    styles.editInput,
    { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
  ];
  const isShadow = Boolean(draft.shadow && !draft.purified);
  const canToggleLucky = isCaught && !isShadow && detail.rarity !== 'Mythic';

  useEffect(() => {
    const query = draft.locationCaught.trim();
    const requestId = ++locationRequestRef.current;

    if (acceptedLocationRef.current === draft.locationCaught) {
      acceptedLocationRef.current = null;
      return undefined;
    }

    if (query.length < 3) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setIsLoadingLocationSuggestions(true);
      void getNativeLocationSuggestions(query)
        .then((suggestions) => {
          if (requestId !== locationRequestRef.current) return;
          setLocationSuggestions(suggestions.map(({ displayName }) => displayName));
          setLocationSuggestionError(null);
        })
        .catch(() => {
          if (requestId !== locationRequestRef.current) return;
          setLocationSuggestions([]);
          setLocationSuggestionError('Location suggestions are unavailable. You can still enter a location manually.');
        })
        .finally(() => {
          if (requestId === locationRequestRef.current) {
            setIsLoadingLocationSuggestions(false);
          }
        });
    }, 250);

    return () => clearTimeout(timeout);
  }, [draft.locationCaught]);

  useEffect(() => {
    if (locationSuggestions.length === 0 || locationInputTargetRef.current == null) return undefined;
    const frame = requestAnimationFrame(() => {
      if (locationInputTargetRef.current != null) {
        onRequestLocationVisibility(locationInputTargetRef.current);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [locationSuggestions.length, onRequestLocationVisibility]);

  const selectLocationSuggestion = (displayName: string) => {
    locationRequestRef.current += 1;
    acceptedLocationRef.current = displayName;
    setLocationSuggestions([]);
    setLocationSuggestionError(null);
    setIsLoadingLocationSuggestions(false);
    onChange({ locationCaught: displayName });
  };

  return (
    <View style={styles.editMetaPanel}>
      <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>CAUGHT DETAILS</Text>

      {isCaught ? (
        <>
          {canToggleLucky ? (
            <NativeToggleGroup
              label="LUCKY"
              onChange={(lucky) => onChange({ lucky, isTraded: lucky || draft.isTraded })}
              options={[
                { label: 'YES', value: true },
                { label: 'NO', value: false },
              ]}
              palette={palette}
              value={draft.lucky}
            />
          ) : null}
          <NativeToggleGroup
            label="OBTAINED IN A TRADE"
            onChange={(isTraded) => onChange({ isTraded })}
            options={[
              { label: 'YES', value: true, disabled: isShadow },
              { label: 'NO', value: false, disabled: draft.lucky },
            ]}
            palette={palette}
            value={draft.isTraded}
          />
          {isShadow ? (
            <Text style={[styles.editHelpText, { color: palette.secondary }]}>Shadow Pokémon cannot be traded until purified.</Text>
          ) : null}
          {draft.lucky ? (
            <Text style={[styles.editHelpText, { color: palette.secondary }]}>Lucky Pokémon are always traded.</Text>
          ) : null}
          {draft.isTraded ? (
            <View style={styles.editFieldGroup}>
              <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>ORIGINAL TRAINER</Text>
              <TextInput
                accessibilityLabel="Original trainer name"
                autoCapitalize="none"
                onChangeText={(originalTrainerName) => onChange({
                  originalTrainerName,
                  originalTrainerId: null,
                })}
                placeholder="Optional"
                placeholderTextColor={palette.secondary}
                style={inputStyle}
                value={draft.originalTrainerName}
              />
              <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>TRADED DATE</Text>
              <TextInput
                accessibilityLabel="Traded date"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onChangeText={(tradedDate) => onChange({ tradedDate })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={palette.secondary}
                style={inputStyle}
                value={draft.tradedDate}
              />
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.editFieldGroup}>
        <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>LOCATION CAUGHT</Text>
        <View style={styles.locationInputWrapper}>
          {locationSuggestions.length > 0 ? (
            <ScrollView
              accessibilityLabel="Location suggestions"
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              showsVerticalScrollIndicator={locationSuggestions.length > 4}
              style={[styles.locationSuggestions, { backgroundColor: palette.panel, borderColor: palette.border }]}
            >
              {locationSuggestions.map((displayName) => (
                <Pressable
                  accessibilityLabel={`Use location ${displayName}`}
                  accessibilityRole="button"
                  key={displayName}
                  onPress={() => selectLocationSuggestion(displayName)}
                  style={({ pressed }) => [
                    styles.locationSuggestion,
                    { borderBottomColor: palette.border },
                    pressed && styles.locationSuggestionPressed,
                  ]}
                >
                  <NativeUiIcon color="#38a9ff" name="map" size={17} />
                  <Text style={[styles.locationSuggestionText, { color: palette.text }]}>{displayName}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <TextInput
            accessibilityLabel="Caught location"
            autoCapitalize="words"
            autoComplete="off"
            onChangeText={(locationCaught) => {
              locationRequestRef.current += 1;
              acceptedLocationRef.current = null;
              setLocationSuggestions([]);
              setLocationSuggestionError(null);
              setIsLoadingLocationSuggestions(false);
              onChange({ locationCaught });
            }}
            onFocus={(event) => {
              locationInputTargetRef.current = event.nativeEvent.target;
              onRequestLocationVisibility(event.nativeEvent.target);
            }}
            placeholder="Location caught"
            placeholderTextColor={palette.secondary}
            style={inputStyle}
            value={draft.locationCaught}
          />
        </View>
        {isLoadingLocationSuggestions ? (
          <View accessibilityLabel="Loading location suggestions" style={styles.locationSuggestionStatus}>
            <ActivityIndicator color="#38a9ff" size="small" />
            <Text style={[styles.locationSuggestionStatusText, { color: palette.secondary }]}>Finding locations…</Text>
          </View>
        ) : null}
        {locationSuggestionError ? (
          <Text accessibilityRole="alert" style={styles.locationSuggestionError}>{locationSuggestionError}</Text>
        ) : null}
        <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>DATE CAUGHT</Text>
        <TextInput
          accessibilityLabel="Caught date"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          onChangeText={(dateCaught) => onChange({ dateCaught })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.secondary}
          style={inputStyle}
          value={draft.dateCaught}
        />
      </View>

      <View style={styles.editFieldGroup}>
        <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>BALL CAUGHT</Text>
        <View accessibilityLabel="Ball Caught" style={styles.ballOptions}>
          {[...BALL_OPTIONS, [null, 'UNKNOWN'] as const].map(([value, label]) => {
            const selected = draft.pokeball === value;
            return (
              <Pressable
                accessibilityLabel={`Ball caught: ${label}`}
                accessibilityRole="button"
                key={label}
                onPress={() => onChange({ pokeball: value })}
                style={[
                  styles.ballOption,
                  { borderColor: selected ? '#38a9ff' : palette.border },
                  selected && styles.booleanOptionSelected,
                ]}
              >
                <Text style={[styles.ballOptionText, { color: palette.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const MaxMoveLevelPicker = ({
  label,
  lockedAllowed,
  value,
  palette,
  onChange,
}: {
  label: string;
  lockedAllowed: boolean;
  value: number | null;
  palette: typeof LIGHT;
  onChange: (value: number) => void;
}) => {
  const options = lockedAllowed ? [0, 1, 2, 3] : [1, 2, 3];
  return (
    <View style={styles.maxMoveRow}>
      <Text style={[styles.maxMoveLabel, { color: palette.text }]}>{label}</Text>
      <View accessibilityLabel={`${label} level`} style={styles.maxMoveOptions}>
        {options.map((option) => {
          const selected = value === option;
          const optionLabel = option === 0 ? 'Locked' : String(option);
          return (
            <Pressable
              accessibilityLabel={`${label}: ${optionLabel}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.maxMoveOption,
                { borderColor: selected ? '#d6298f' : palette.border },
                selected && styles.maxMoveOptionSelected,
              ]}
            >
              <Text style={[styles.maxMoveOptionText, { color: palette.text }]}>{optionLabel}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const PowerFormOption = ({
  disabled = false,
  imageUri,
  label,
  selected,
  palette,
  onPress,
}: {
  disabled?: boolean;
  imageUri: string | null;
  label: string;
  selected: boolean;
  palette: typeof LIGHT;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityLabel={`Power form: ${label}`}
    accessibilityRole="button"
    accessibilityState={{ disabled, selected }}
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.powerFormOption,
      { borderColor: selected ? '#5faeff' : palette.border },
      selected && styles.powerFormOptionSelected,
      disabled && styles.powerFormOptionDisabled,
    ]}
  >
    {imageUri ? (
      <Image fadeDuration={0}
        accessibilityElementsHidden
        resizeMode="contain"
        source={{ uri: imageUri }}
        style={styles.powerFormImage}
      />
    ) : null}
    <Text numberOfLines={2} style={[styles.powerFormLabel, { color: palette.text }]}>{label}</Text>
  </Pressable>
);

const NativePowerControls = ({
  assetBaseUrl,
  detail,
  draft,
  isCaught,
  isWanted,
  palette,
  onChange,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail;
  draft: NativeInstanceEditDraft;
  isCaught: boolean;
  isWanted: boolean;
  palette: typeof LIGHT;
  onChange: (patch: Partial<NativeInstanceEditDraft>) => void;
}) => {
  const supportsShadowState = isCaught && Boolean(
    detail.instance?.shadow
    || detail.instance?.purified
    || draft.shadow
    || draft.purified,
  );
  const supportsMega = !isWanted
    && !draft.shadow
    && !draft.fused
    && (detail.megaOptions?.length ?? 0) > 0
    && !detail.row.name.toLowerCase().includes('clone');
  const supportsCrown = !isWanted
    && !draft.shadow
    && !draft.fused
    && (detail.crownOptions?.length ?? 0) > 0;
  const supportsFusion = isCaught
    && !draft.shadow
    && !draft.megaEnabled
    && !draft.crowned
    && (detail.fusionOptions?.length ?? 0) > 0;
  const supportsMaxMoves = !isWanted
    && Boolean(detail.row.maxKind || detail.specialMaxBaseEligible || draft.crowned)
    && !draft.shadow
    && !draft.purified
    && detail.instance?.costume_id == null;
  const selectedFusion = detail.fusionOptions?.find((option) => option.id === draft.fusionId) ?? null;
  const compatibleMovePatch = (options: NativeInstanceMoveOption[] | undefined) => {
    const supports = (id: number | null, kind: NativeInstanceMoveOption['kind']) => (
      id == null || Boolean(options?.some((move) => move.id === id && move.kind === kind))
    );
    return {
      fastMove: supports(draft.fastMove, 'fast') ? draft.fastMove : null,
      chargedMove1: supports(draft.chargedMove1, 'charged') ? draft.chargedMove1 : null,
      chargedMove2: supports(draft.chargedMove2, 'charged') ? draft.chargedMove2 : null,
    };
  };
  const compatibleBackgroundPatch = (options: NativeInstanceBackgroundOption[] | undefined) => ({
    locationCard: draft.locationCard == null
      || options?.some((background) => String(background.id) === draft.locationCard)
      ? draft.locationCard
      : null,
  });
  if (!supportsShadowState && !supportsMega && !supportsCrown && !supportsFusion && !supportsMaxMoves) return null;

  return (
    <View style={[styles.powerPanel, { borderColor: palette.border }]}>
      <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>FORM &amp; POWER</Text>
      {supportsShadowState ? (
        <View style={styles.editFieldGroup}>
          <Text style={[styles.powerTitle, { color: palette.text }]}>Shadow state</Text>
          <View accessibilityLabel="Shadow state" style={styles.booleanOptions}>
            {([
              { label: 'SHADOW', shadow: true, purified: false },
              { label: 'PURIFIED', shadow: false, purified: true },
            ] as const).map((option) => {
              const selected = option.shadow ? draft.shadow : draft.purified;
              return (
                <Pressable
                  accessibilityLabel={`Shadow state: ${option.label === 'SHADOW' ? 'Shadow' : 'Purified'}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.label}
                  onPress={() => onChange(option.shadow
                    ? {
                        shadow: true,
                        purified: false,
                        lucky: false,
                        isTraded: false,
                        originalTrainerId: null,
                        originalTrainerName: '',
                        tradedDate: '',
                        fused: false,
                        fusionId: null,
                        fusionForm: null,
                        fusedWith: null,
                        megaEnabled: false,
                        megaForm: null,
                        crowned: false,
                      }
                    : { shadow: false, purified: true })}
                  style={[
                    styles.booleanOption,
                    { borderColor: selected ? '#8f72e8' : palette.border },
                    selected && styles.shadowOptionSelected,
                  ]}
                >
                  <Text style={[styles.booleanOptionText, { color: palette.text }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.editHelpText, { color: palette.secondary }]}>
            Reverting to Shadow clears Lucky and traded status, matching Pokémon GO rules.
          </Text>
        </View>
      ) : null}
      {supportsFusion ? (
        <View style={styles.editFieldGroup}>
          <Text style={[styles.powerTitle, { color: palette.text }]}>Fusion</Text>
          <Text style={[styles.editHelpText, { color: palette.secondary }]}>Choose a form and the caught partner it consumes.</Text>
          <View style={styles.powerFormOptions}>
            <PowerFormOption
              imageUri={detail.appearanceImageUris?.base ?? detail.row.imageUri}
              label="Base form"
              onPress={() => onChange({
                fused: false,
                fusionId: null,
                fusionForm: null,
                fusedWith: null,
                ...compatibleMovePatch(detail.moveOptions),
                ...compatibleBackgroundPatch(detail.backgroundOptions),
              })}
              palette={palette}
              selected={!draft.fused}
            />
            {(detail.fusionOptions ?? []).map((option) => {
              const firstPartner = option.partnerRows[0] ?? null;
              return (
                <PowerFormOption
                  disabled={!firstPartner}
                  imageUri={option.imageUri}
                  key={option.id}
                  label={firstPartner ? option.name : `${option.name} · partner needed`}
                  onPress={() => onChange({
                    fused: true,
                    fusionId: option.id,
                    fusionForm: option.name,
                    fusedWith: firstPartner?.id ?? null,
                    megaEnabled: false,
                    megaForm: null,
                    crowned: false,
                    ...compatibleMovePatch(option.moveOptions),
                    ...compatibleBackgroundPatch(option.backgroundOptions),
                  })}
                  palette={palette}
                  selected={draft.fused && draft.fusionId === option.id}
                />
              );
            })}
          </View>
          {draft.fused && selectedFusion ? (
            <View style={styles.fusionPartnerPanel}>
              <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>FUSION PARTNER</Text>
              <View style={styles.powerFormOptions}>
                {selectedFusion.partnerRows.map((partner) => (
                  <PowerFormOption
                    imageUri={partner.imageUri}
                    key={partner.id}
                    label={partner.name}
                    onPress={() => onChange({ fusedWith: partner.id })}
                    palette={palette}
                    selected={draft.fusedWith === partner.id}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      {supportsMega ? (
        <View style={styles.editFieldGroup}>
          <Text style={[styles.powerTitle, { color: palette.text }]}>Mega Evolution</Text>
          <View style={styles.powerFormOptions}>
            <PowerFormOption
              imageUri={detail.appearanceImageUris?.base ?? detail.row.imageUri}
              label="Base form"
              onPress={() => onChange({ megaEnabled: false, megaForm: null })}
              palette={palette}
              selected={!draft.megaEnabled}
            />
            {(detail.megaOptions ?? []).map((option) => (
              <PowerFormOption
                imageUri={option.imageUri}
                key={`${option.label}-${option.form ?? 'default'}`}
                label={option.label}
                onPress={() => onChange({
                  megaEnabled: true,
                  megaForm: option.form,
                  fused: false,
                  fusionId: null,
                  fusionForm: null,
                  fusedWith: null,
                })}
                palette={palette}
                selected={draft.megaEnabled && draft.megaForm === option.form}
              />
            ))}
          </View>
        </View>
      ) : null}
      {supportsCrown ? (
        <View style={styles.editFieldGroup}>
          <Text style={[styles.powerTitle, { color: palette.text }]}>Crowned Form</Text>
          <View style={styles.powerFormOptions}>
            <PowerFormOption
              imageUri={detail.appearanceImageUris?.base ?? detail.row.imageUri}
              label="Hero form"
              onPress={() => onChange({
                crowned: false,
                ...compatibleMovePatch(detail.moveOptions),
              })}
              palette={palette}
              selected={!draft.crowned}
            />
            {(detail.crownOptions ?? []).map((option) => (
              <PowerFormOption
                imageUri={option.imageUri}
                key={`${option.label}-${option.form ?? 'default'}`}
                label={option.label}
                onPress={() => onChange({
                  crowned: true,
                  crownForm: option.form,
                  fused: false,
                  fusionId: null,
                  fusionForm: null,
                  fusedWith: null,
                  ...compatibleMovePatch(option.moveOptions ?? detail.moveOptions),
                })}
                palette={palette}
                selected={draft.crowned && draft.crownForm === option.form}
              />
            ))}
          </View>
        </View>
      ) : null}
      {supportsMaxMoves ? (
        <View style={styles.maxMovesPanel}>
          <View style={styles.maxMovesHeading}>
            <Image fadeDuration={0}
              accessibilityElementsHidden
              resizeMode="contain"
              source={{ uri: toAssetUrl(assetBaseUrl, `/images/${detail.row.maxKind ?? 'dynamax'}.png`) }}
              style={styles.maxMovesIcon}
            />
            <View>
              <Text style={[styles.powerTitle, { color: palette.text }]}>Max Move Levels</Text>
              <Text style={[styles.editHelpText, { color: palette.secondary }]}>Set the levels unlocked in Pokémon GO.</Text>
            </View>
          </View>
          <MaxMoveLevelPicker
            label="Max Attack"
            lockedAllowed={false}
            onChange={(maxAttack) => onChange({ maxAttack })}
            palette={palette}
            value={draft.maxAttack}
          />
          <MaxMoveLevelPicker
            label="Max Guard"
            lockedAllowed
            onChange={(maxGuard) => onChange({ maxGuard })}
            palette={palette}
            value={draft.maxGuard}
          />
          <MaxMoveLevelPicker
            label="Max Spirit"
            lockedAllowed
            onChange={(maxSpirit) => onChange({ maxSpirit })}
            palette={palette}
            value={draft.maxSpirit}
          />
        </View>
      ) : null}
    </View>
  );
};

const NativeInstanceEditFields = ({
  assetBaseUrl,
  detail,
  draft,
  isCaught,
  isWanted,
  palette,
  typeIconUris,
  onChange,
  onRequestLocationVisibility,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail;
  draft: NativeInstanceEditDraft;
  isCaught: boolean;
  isWanted: boolean;
  palette: typeof LIGHT;
  typeIconUris: string[];
  onChange: (patch: Partial<NativeInstanceEditDraft>) => void;
  onRequestLocationVisibility: (target: number) => void;
}) => {
  const [moveDamageMode, setMoveDamageMode] = useState<PokemonMoveDamageMode>('raid');
  const inputStyle = [
    styles.editInput,
    { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
  ];
  const selectedFusionMoves = draft.fused
    ? detail.fusionOptions?.find((option) => option.id === draft.fusionId)?.moveOptions
    : null;
  const selectedCrownMoves = draft.crowned
    ? detail.crownOptions?.find((option) => option.form === draft.crownForm)?.moveOptions
    : null;
  const editMoveOptions = selectedFusionMoves ?? selectedCrownMoves ?? detail.moveOptions ?? [];
  return (
    <View accessibilityLabel="Pokémon detail editor" style={styles.editFields}>
      <View style={styles.editFieldGroup}>
        <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>NAME</Text>
        <TextInput
          accessibilityLabel="Pokémon nickname"
          autoCapitalize="words"
          maxLength={12}
          onChangeText={(nickname) => onChange({ nickname })}
          placeholder="Pokémon name"
          placeholderTextColor={palette.secondary}
          selectTextOnFocus
          style={[...inputStyle, styles.editNameInput]}
          value={draft.nickname}
        />
      </View>

      {!isWanted ? (
        <View style={styles.editTwoColumns}>
          <View style={styles.editColumn}>
            <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>CP</Text>
            <TextInput
              accessibilityLabel="Combat Power"
              keyboardType="number-pad"
              onChangeText={(cp) => onChange({ cp })}
              placeholder="CP"
              placeholderTextColor={palette.secondary}
              selectTextOnFocus
              style={inputStyle}
              value={draft.cp}
            />
          </View>
          <View style={styles.editColumn}>
            <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>LEVEL</Text>
            <TextInput
              accessibilityLabel="Pokémon level"
              keyboardType="decimal-pad"
              onChangeText={(level) => onChange({ level })}
              placeholder="1–51"
              placeholderTextColor={palette.secondary}
              selectTextOnFocus
              style={inputStyle}
              value={draft.level}
            />
          </View>
        </View>
      ) : null}

      <NativePowerControls
        assetBaseUrl={assetBaseUrl}
        detail={detail}
        draft={draft}
        isCaught={isCaught}
        isWanted={isWanted}
        onChange={onChange}
        palette={palette}
      />

      <View style={styles.editFieldGroup}>
        <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>GENDER</Text>
        <View style={styles.genderOptions}>
          {[
            { label: 'Any', value: null },
            { label: '♂ Male', value: 'Male' },
            { label: '♀ Female', value: 'Female' },
            { label: 'Genderless', value: 'Genderless' },
          ].map((option) => {
            const selected = draft.gender === option.value;
            return (
              <Pressable
                accessibilityRole="button"
                key={option.label}
                onPress={() => onChange({ gender: option.value })}
                style={[
                  styles.genderOption,
                  { borderColor: selected ? '#38a9ff' : palette.border },
                  selected && styles.genderOptionSelected,
                ]}
              >
                <Text style={[styles.genderOptionText, { color: palette.text }]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isWanted ? (
        <NativeWantedSizeControls draft={draft} onChange={onChange} palette={palette} />
      ) : null}

      {!isWanted ? (
        <View style={styles.editMeasurements}>
          <View style={styles.editColumn}>
            <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>WEIGHT (KG)</Text>
            <TextInput
              accessibilityLabel="Pokémon weight"
              keyboardType="decimal-pad"
              onChangeText={(weight) => onChange({ weight })}
              placeholder="Optional"
              placeholderTextColor={palette.secondary}
              selectTextOnFocus
              style={inputStyle}
              value={draft.weight}
            />
          </View>
          <View
            accessibilityLabel={pokemonTypesAccessibilityLabel(typeIconUris)}
            accessible
            style={styles.editTypes}
            testID={pokemonTypesTestId(typeIconUris)}
          >
            {typeIconUris.map((uri) => (
              <Image fadeDuration={0}
                accessibilityLabel={`${uri.match(/\/([^/?]+)\.png(?:\?|$)/i)?.[1] ?? 'Pokémon'} type`}
                key={uri}
                source={{ uri }}
                style={styles.editTypeIcon}
              />
            ))}
          </View>
          <View style={styles.editColumn}>
            <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>HEIGHT (M)</Text>
            <TextInput
              accessibilityLabel="Pokémon height"
              keyboardType="decimal-pad"
              onChangeText={(height) => onChange({ height })}
              placeholder="Optional"
              placeholderTextColor={palette.secondary}
              selectTextOnFocus
              style={inputStyle}
              value={draft.height}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.editFieldGroup}>
        <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>MOVES</Text>
        <NativeMoveModeTabs
          mode={moveDamageMode}
          onChange={setMoveDamageMode}
          palette={palette}
        />
        <NativeMoveSelector
          damageMode={moveDamageMode}
          label="Fast move"
          onChange={(fastMove) => onChange({ fastMove })}
          options={editMoveOptions.filter((move) => move.kind === 'fast')}
          palette={palette}
          value={draft.fastMove}
        />
        <NativeMoveSelector
          damageMode={moveDamageMode}
          label="Charged move"
          onChange={(chargedMove1) => onChange({ chargedMove1 })}
          options={editMoveOptions.filter((move) => move.kind === 'charged')}
          palette={palette}
          value={draft.chargedMove1}
        />
        <NativeMoveSelector
          damageMode={moveDamageMode}
          label="Second charged move"
          onChange={(chargedMove2) => onChange({ chargedMove2 })}
          options={editMoveOptions.filter((move) => move.kind === 'charged')}
          palette={palette}
          value={draft.chargedMove2}
        />
      </View>

      {!isWanted ? (
        <>
          <View style={styles.editFieldGroup}>
            <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>APPRAISAL IVS</Text>
            <View style={styles.editThreeColumns}>
              {[
                { label: 'Attack', key: 'attackIv' as const },
                { label: 'Defense', key: 'defenseIv' as const },
                { label: 'HP', key: 'staminaIv' as const },
              ].map((field) => (
                <View key={field.key} style={styles.editColumn}>
                  <Text style={[styles.inlineInputLabel, { color: palette.secondary }]}>{field.label}</Text>
                  <TextInput
                    accessibilityLabel={`${field.label} IV`}
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={(value) => onChange({ [field.key]: value })}
                    placeholder="0–15"
                    placeholderTextColor={palette.secondary}
                    selectTextOnFocus
                    style={inputStyle}
                    value={draft[field.key]}
                  />
                </View>
              ))}
            </View>
          </View>

          <NativeCaughtMetadataControls
            detail={detail}
            draft={draft}
            isCaught={isCaught}
            onChange={onChange}
            onRequestLocationVisibility={onRequestLocationVisibility}
            palette={palette}
          />
        </>
      ) : null}
    </View>
  );
};

const NativeInstanceSwipeFrame = memo(function NativeInstanceSwipeFrame({
  activeItemKey,
  background,
  children,
  disabled,
  onNext,
  onPrevious,
}: {
  activeItemKey: string;
  background: ReactNode;
  children: ReactNode;
  disabled: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}) {
  const overlaySwipe = useNativeOverlaySwipeNavigation({
    activeItemKey,
    disabled,
    onNext,
    onPrevious,
  });
  const axisLockDelta = collectionExperienceParityContract.instanceOverlaySwipe.axisLockDelta;

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.backgroundLayer, overlaySwipe.backgroundMotionStyle]}
        testID="native-instance-background-layer"
      >
        {background}
      </Animated.View>
      <View pointerEvents="none" style={styles.backgroundTint} />
      <PanGestureHandler
        activeOffsetX={[-axisLockDelta, axisLockDelta]}
        enabled={overlaySwipe.panEnabled}
        failOffsetY={[-axisLockDelta, axisLockDelta]}
        onGestureEvent={overlaySwipe.panGestureEvent}
        onHandlerStateChange={overlaySwipe.onPanHandlerStateChange}
      >
        <Animated.View
          style={[styles.motionLayer, overlaySwipe.motionStyle]}
          testID="native-instance-motion-layer"
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
      {onPrevious ? (
        <Pressable
          accessibilityLabel="Previous Pokémon"
          accessibilityRole="button"
          accessibilityState={{ disabled: overlaySwipe.isAnimating }}
          disabled={overlaySwipe.isAnimating}
          onPress={overlaySwipe.navigatePrevious}
          style={[styles.instanceNavigation, styles.previousInstance, { bottom: 24 }]}
          testID="native-instance-previous"
        >
          <Text style={styles.instanceNavigationIcon}>◀</Text>
        </Pressable>
      ) : null}
      {onNext ? (
        <Pressable
          accessibilityLabel="Next Pokémon"
          accessibilityRole="button"
          accessibilityState={{ disabled: overlaySwipe.isAnimating }}
          disabled={overlaySwipe.isAnimating}
          onPress={overlaySwipe.navigateNext}
          style={[styles.instanceNavigation, styles.nextInstance, { bottom: 24 }]}
          testID="native-instance-next"
        >
          <Text style={styles.instanceNavigationIcon}>▶</Text>
        </Pressable>
      ) : null}
    </>
  );
});

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
  onOpenTarget,
  onToggleFavorite,
  onEditInCurrentApp,
  onEditPreferences,
  onSaveDetails,
  canEdit = true,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktopLayout = width >= 768;
  const shellWidth = Math.min(width * 0.95, 500);
  const palette = light ? LIGHT : DARK;
  const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<{
    instanceId: string;
    value: NativeInstanceEditDraft;
  } | null>(null);
  const [editErrorState, setEditErrorState] = useState<{
    instanceId: string;
    message: string;
  } | null>(null);
  const [backgroundPickerInstanceId, setBackgroundPickerInstanceId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const requestKeyboardFieldVisibility = useCallback((target: number) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        target,
        230,
        true,
      );
    });
  }, []);
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
  const status = (light ? LIGHT_STATUS : STATUS)[detail.row.status];
  const isCaught = detail.row.status === 'caught';
  const isTrade = detail.row.status === 'trade';
  const isWanted = detail.row.status === 'wanted';
  const caughtDate = !isWanted && detail.instance?.date_caught
    ? detail.instance.date_caught.slice(0, 10)
    : null;
  const caughtDateParts = caughtDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? null;
  const level = instance?.level ?? Number(
    detail.stats.find((row) => row.label === 'Level')?.value ?? Number.NaN,
  );
  const cp = instance?.cp ?? detail.row.cp;
  const weight = typeof instance?.weight === 'number' && instance.weight > 0
    ? instance.weight
    : null;
  const height = typeof instance?.height === 'number' && instance.height > 0
    ? instance.height
    : null;
  const gender = instance?.gender;
  const maxBadge = detail.row.maxKind
    ? toAssetUrl(assetBaseUrl, `/images/${detail.row.maxKind}.png`)
    : null;
  const statusLabel = status.label;
  const editing = editingInstanceId === detail.row.id;
  const activeDraft = draftState?.instanceId === detail.row.id
    ? draftState.value
    : createEditDraft(detail);
  const editError = editErrorState?.instanceId === detail.row.id
    ? editErrorState.message
    : null;
  const displayLevel = editing ? Number(activeDraft.level) : level;
  const showArc = Number.isFinite(displayLevel);
  const backgroundPickerOpen = backgroundPickerInstanceId === detail.row.id;
  const selectedFusionOption = activeDraft.fused
    ? detail.fusionOptions?.find((option) => option.id === activeDraft.fusionId) ?? null
    : null;
  const selectedMegaOption = activeDraft.megaEnabled
    ? detail.megaOptions?.find((option) => option.form === activeDraft.megaForm) ?? null
    : null;
  const selectedCrownOption = activeDraft.crowned
    ? detail.crownOptions?.find((option) => option.form === activeDraft.crownForm) ?? null
    : null;
  const displayTypeIconUris = editing
    ? selectedFusionOption?.typeIconUris?.length
      ? selectedFusionOption.typeIconUris
      : selectedMegaOption?.typeIconUris?.length
        ? selectedMegaOption.typeIconUris
        : selectedCrownOption?.typeIconUris?.length
          ? selectedCrownOption.typeIconUris
          : detail.row.typeIconUris
    : detail.row.typeIconUris;
  const showPhysicalRow = weight != null
    || height != null
    || (isCaught && displayTypeIconUris.length > 0);
  const activeBackgroundOptions = selectedFusionOption?.backgroundOptions
    ?? detail.backgroundOptions
    ?? [];
  const displayLucky = editing
    ? isWanted ? activeDraft.prefLucky : activeDraft.lucky
    : Boolean(detail.row.lucky || instance?.lucky || (isWanted && instance?.pref_lucky));
  const displayShadow = editing ? activeDraft.shadow : Boolean(instance?.shadow && !instance?.purified);
  const displayPurified = editing ? activeDraft.purified : Boolean(instance?.purified);
  const displayImageUri = editing
    ? activeDraft.fused
      ? detail.fusionOptions?.find((option) => option.id === activeDraft.fusionId)?.imageUri
        ?? detail.row.imageUri
      : activeDraft.megaEnabled
      ? detail.megaOptions?.find((option) => option.form === activeDraft.megaForm)?.imageUri
        ?? detail.megaOptions?.[0]?.imageUri
        ?? detail.row.imageUri
      : activeDraft.crowned
        ? detail.crownOptions?.find((option) => option.form === activeDraft.crownForm)?.imageUri
          ?? detail.crownOptions?.[0]?.imageUri
          ?? detail.row.imageUri
        : displayShadow
      ? detail.appearanceImageUris?.shadow ?? detail.row.imageUri
      : displayPurified
        ? detail.appearanceImageUris?.purified ?? detail.row.imageUri
        : detail.appearanceImageUris?.base ?? detail.row.imageUri
    : detail.row.imageUri;
  const selectedLocationBackgroundUri = editing
    ? (() => {
        const selected = activeBackgroundOptions.find(
          (option) => String(option.id) === activeDraft.locationCard,
        );
        if (!selected || !selectedFusionOption || !activeDraft.fusedWith) {
          return selected?.imageUri ?? null;
        }
        const partnerBackgroundId = selectedFusionOption.partnerBackgroundIds[activeDraft.fusedWith];
        return selectedFusionOption.comboBackgrounds.find((candidate) => (
          candidate.ownBackgroundId === selected.id
          && candidate.partnerBackgroundId === partnerBackgroundId
        ))?.option.imageUri ?? selected.imageUri;
      })()
    : detail.row.locationBackgroundUri;
  const updateDraft = (patch: Partial<NativeInstanceEditDraft>) => {
    setDraftState((current) => {
      const next = {
        ...(current?.instanceId === detail.row.id ? current.value : createEditDraft(detail)),
        ...patch,
      };
      const calculatedCp = isWanted ? null : calculateNativeDraftCp(detail, next);
      return {
        instanceId: detail.row.id,
        value: calculatedCp == null ? next : { ...next, cp: String(calculatedCp) },
      };
    });
    setEditErrorState(null);
  };
  const toggleEdit = async () => {
    if (!canEdit) return;
    if (!onSaveDetails) {
      onEditInCurrentApp?.();
      return;
    }
    if (!editing) {
      setDraftState({ instanceId: detail.row.id, value: createEditDraft(detail) });
      setEditErrorState(null);
      setEditingInstanceId(detail.row.id);
      return;
    }
    try {
      const combatValidation = !isWanted && detail.baseStats
        ? validateNativeCombatDraft(detail, activeDraft)
        : null;
      const combatError = combatValidation == null
        ? null
        : firstNativeCombatError(combatValidation);
      if (combatError) {
        setEditErrorState({ instanceId: detail.row.id, message: combatError });
        return;
      }
      const patch: NativeInstanceDetailPatch = isWanted
        ? {
            nickname: !instance?.nickname
              && activeDraft.nickname.trim() === detail.row.name.trim().split(/\s+/).at(-1)
              ? null
              : activeDraft.nickname,
            gender: activeDraft.gender,
            friendship_level: activeDraft.friendship,
            pref_lucky: activeDraft.prefLucky,
            most_wanted: activeDraft.mostWanted,
            fast_move_id: activeDraft.fastMove,
            charged_move1_id: activeDraft.chargedMove1,
            charged_move2_id: activeDraft.chargedMove2,
            location_card: activeDraft.locationCard,
            weight: null,
            height: null,
            wanted_size_preferences: buildWantedSizePreferences(activeDraft, detail.sizeThresholds),
          }
        : {
            nickname: !instance?.nickname
              && activeDraft.nickname.trim() === detail.row.name.trim().split(/\s+/).at(-1)
              ? null
              : activeDraft.nickname,
            cp: combatValidation?.computed.cp ?? nullableNumber(activeDraft.cp),
            level: combatValidation?.computed.level ?? nullableNumber(activeDraft.level),
            gender: activeDraft.gender,
            weight: nullableNumber(activeDraft.weight),
            height: nullableNumber(activeDraft.height),
            attack_iv: combatValidation?.computed.ivs?.attack ?? nullableNumber(activeDraft.attackIv),
            defense_iv: combatValidation?.computed.ivs?.defense ?? nullableNumber(activeDraft.defenseIv),
            stamina_iv: combatValidation?.computed.ivs?.stamina ?? nullableNumber(activeDraft.staminaIv),
            location_caught: activeDraft.locationCaught,
            date_caught: activeDraft.dateCaught,
            fast_move_id: activeDraft.fastMove,
            charged_move1_id: activeDraft.chargedMove1,
            charged_move2_id: activeDraft.chargedMove2,
            location_card: activeDraft.locationCard,
            lucky: isCaught ? activeDraft.lucky : instance?.lucky,
            is_traded: isCaught
              ? activeDraft.lucky || activeDraft.isTraded
              : instance?.is_traded,
            original_trainer_id: isCaught && activeDraft.isTraded
              ? activeDraft.originalTrainerId
              : instance?.original_trainer_id,
            original_trainer_name: isCaught && activeDraft.isTraded
              ? activeDraft.originalTrainerName
              : instance?.original_trainer_name,
            traded_date: isCaught && activeDraft.isTraded
              ? activeDraft.tradedDate
              : instance?.traded_date,
            pokeball: activeDraft.pokeball,
            shadow: isCaught ? activeDraft.shadow : instance?.shadow,
            purified: isCaught ? activeDraft.purified : instance?.purified,
            max_attack: detail.row.maxKind || detail.specialMaxBaseEligible || activeDraft.crowned
              ? activeDraft.maxAttack
              : instance?.max_attack,
            max_guard: detail.row.maxKind || detail.specialMaxBaseEligible || activeDraft.crowned
              ? activeDraft.maxGuard
              : instance?.max_guard,
            max_spirit: detail.row.maxKind || detail.specialMaxBaseEligible || activeDraft.crowned
              ? activeDraft.maxSpirit
              : instance?.max_spirit,
            mega: activeDraft.megaEnabled,
            is_mega: activeDraft.megaEnabled,
            mega_form: activeDraft.megaEnabled ? activeDraft.megaForm : null,
            crown: activeDraft.fused ? false : activeDraft.crowned,
            is_fused: activeDraft.fused,
            fused_with: activeDraft.fused ? activeDraft.fusedWith : null,
            fusion: activeDraft.fused && activeDraft.fusionId != null
              ? { [activeDraft.fusionId]: true }
              : instance?.fusion,
            fusion_form: activeDraft.fused
              ? activeDraft.fusionForm
              : activeDraft.crowned
                ? activeDraft.crownForm
                : null,
          };
      await onSaveDetails(patch);
      setEditingInstanceId(null);
      setEditErrorState(null);
    } catch (saveFailure) {
      setEditErrorState({
        instanceId: detail.row.id,
        message: saveFailure instanceof Error
          ? saveFailure.message
          : 'Pokémon details could not be saved.',
      });
    }
  };

  return (
    <View style={styles.overlay} testID="native-instance-overlay">
      <NativeInstanceSwipeFrame
        activeItemKey={detail.row.id}
        background={(
          <Image fadeDuration={0}
          accessibilityElementsHidden
          blurRadius={3}
          resizeMode="cover"
          source={{
            uri: toAssetUrl(
              assetBaseUrl,
              backgroundPath(detail, editing ? {
                lucky: displayLucky,
                purified: displayPurified,
                shadow: displayShadow,
                typeIconUris: displayTypeIconUris,
              } : undefined),
            ),
          }}
          style={styles.fullBackground}
          testID="native-instance-background"
          />
        )}
        disabled={editingInstanceId === detail.row.id
          || backgroundPickerInstanceId === detail.row.id}
        onNext={onNext}
        onPrevious={onPrevious}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + (isTrade ? 0 : isWanted ? 10 : 30),
              paddingBottom: 104 + insets.bottom,
            },
          ]}
          directionalLockEnabled
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          testID="native-instance-scroll"
        >
          <View
            style={[styles.shell, { width: shellWidth }]}
            testID="native-instance-swipe-surface"
          >
          {cachedAt != null ? (
            <View accessibilityLiveRegion="polite" style={styles.offlineBanner}>
              <Text style={styles.offlineTitle}>Viewing an offline copy</Text>
              <Text style={styles.offlineBody}>Saved changes will synchronize after reconnecting.</Text>
            </View>
          ) : null}

          {isWanted ? (
            <FriendshipConditions
              accent={status.accent}
              assetBaseUrl={assetBaseUrl}
              detail={detail}
              draft={activeDraft}
              editing={editing}
              canPickBackground={activeBackgroundOptions.length > 0}
              onDraftChange={updateDraft}
              onEdit={() => void toggleEdit()}
              onOpenBackground={() => setBackgroundPickerInstanceId(detail.row.id)}
              palette={palette}
              canEdit={canEdit}
            />
          ) : (
            <View style={styles.headerRow}>
              {canEdit && !editing ? (
                <Pressable
                  accessibilityLabel="Edit Pokémon"
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={() => void toggleEdit()}
                  style={styles.iconButton}
                >
                  <Image fadeDuration={0}
                    accessibilityElementsHidden
                    resizeMode="contain"
                    source={{ uri: toAssetUrl(assetBaseUrl, '/images/edit-icon.png') }}
                    style={[styles.editImage, styles.stageHeaderIcon]}
                  />
                </Pressable>
              ) : <View style={styles.iconButton} />}
              {!isWanted && cp != null && !editing ? (
                <Text style={styles.cpText}>
                  <Text style={[styles.cpLabel, desktopLayout && styles.cpLabelDesktop]}>CP</Text>
                  <Text style={[styles.cpValue, desktopLayout && styles.cpValueDesktop]}>{cp}</Text>
                </Text>
              ) : <View />}
              {editing ? (
                activeBackgroundOptions.length > 0 ? (
                  <Pressable
                    accessibilityLabel="Choose location background"
                    accessibilityRole="button"
                    onPress={() => setBackgroundPickerInstanceId(detail.row.id)}
                    style={styles.iconButton}
                  >
                    <Image fadeDuration={0}
                      accessibilityElementsHidden
                      resizeMode="contain"
                      source={{ uri: toAssetUrl(assetBaseUrl, '/images/location.png') }}
                      style={[styles.editImage, styles.stageHeaderIcon]}
                    />
                  </Pressable>
                ) : <View style={styles.iconButton} />
              ) : isCaught && canEdit ? (
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

          {!isWanted && showArc ? (
            <View style={styles.arc}>
              <LevelArc level={displayLevel} />
            </View>
          ) : null}

          <View style={[
            styles.imageStage,
            isWanted && (desktopLayout ? styles.wantedImageStageDesktop : styles.wantedImageStage),
            isTrade && styles.tradeImageStage,
          ]}>
            {selectedLocationBackgroundUri ? (
              <View style={[styles.locationBackdrop, { width: Math.min(shellWidth, 447) }]}>
                <NativePokemonLocationBackdrop uri={selectedLocationBackgroundUri} />
              </View>
            ) : null}
            {displayLucky ? (
              <Image fadeDuration={0}
                accessibilityElementsHidden
                resizeMode="contain"
                source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky.png') }}
                style={[
                  styles.luckyBackdrop,
                  isWanted && (desktopLayout ? styles.wantedLuckyBackdropDesktop : styles.wantedLuckyBackdrop),
                ]}
              />
            ) : null}
            {displayImageUri ? (
              <Image fadeDuration={0}
                accessibilityLabel={detail.row.name}
                resizeMode="contain"
                source={{ uri: displayImageUri }}
                style={[
                  styles.pokemonImage,
                  isWanted && (desktopLayout ? styles.wantedPokemonImageDesktop : styles.wantedPokemonImage),
                  isTrade && styles.tradePokemonImage,
                ]}
              />
            ) : null}
            {maxBadge ? (
              <Image fadeDuration={0}
                accessibilityLabel={detail.row.maxKind === 'gigantamax' ? 'Gigantamax' : 'Dynamax'}
                resizeMode="contain"
                source={{ uri: maxBadge }}
                style={[
                  styles.maxBadge,
                  isWanted && (desktopLayout ? styles.wantedMaxBadgeDesktop : styles.wantedMaxBadge),
                ]}
              />
            ) : null}
            {displayPurified ? (
              <Image fadeDuration={0}
                accessibilityLabel="Purified"
                resizeMode="contain"
                source={{ uri: toAssetUrl(assetBaseUrl, '/images/purified.png') }}
                style={styles.purifiedBadge}
              />
            ) : null}
          </View>

          <View style={[
            styles.detailsPanel,
            isWanted && (desktopLayout ? styles.wantedDetailsPanelDesktop : styles.wantedDetailsPanel),
            isTrade && styles.tradeDetailsPanel,
            { backgroundColor: palette.panel },
          ]}>
            {!editing && caughtDateParts ? (
              <View
                accessibilityLabel={`Caught on ${caughtDate}`}
                accessible
                style={styles.caughtDateBadge}
              >
                <Image fadeDuration={0}
                  accessibilityElementsHidden
                  source={{ uri: toAssetUrl(assetBaseUrl, '/images/balls/pokeball.png') }}
                  style={styles.caughtDateBall}
                />
                <View>
                  <Text style={styles.caughtDateYear}>{caughtDateParts[1]}</Text>
                  <Text style={styles.caughtDateDay}>{caughtDateParts[2]}-{caughtDateParts[3]}</Text>
                </View>
              </View>
            ) : null}
            {statusLabel ? (
              <Text style={[styles.statusEyebrow, { color: status.accent }]}>{statusLabel}</Text>
            ) : null}
            {editing ? (
              <NativeInstanceEditFields
                assetBaseUrl={assetBaseUrl}
                detail={detail}
                draft={activeDraft}
                isCaught={isCaught}
                isWanted={isWanted}
                onChange={updateDraft}
                onRequestLocationVisibility={requestKeyboardFieldVisibility}
                palette={palette}
                typeIconUris={displayTypeIconUris}
              />
            ) : (
              <Text accessibilityRole="header" style={[
                styles.name,
                desktopLayout && styles.nameDesktop,
                { color: palette.text },
              ]}>
                {detail.row.name}
              </Text>
            )}

            {!editing && ((!isWanted && showArc) || Boolean(gender)) ? (
              <View style={styles.levelGenderRow}>
                <View style={styles.sideSlot} />
                {!isWanted && showArc ? (
                  <Text style={[styles.levelText, { color: palette.secondary }]}>LEVEL: {displayLevel}</Text>
                ) : <View />}
                <Text style={[styles.genderText, { color: gender === 'Female' ? '#ff3b87' : '#30a7ff' }]}>
                  {gender === 'Female' ? '♀' : gender === 'Male' ? '♂' : ''}
                </Text>
              </View>
            ) : null}

            {!editing && !isWanted && showPhysicalRow ? (
              <View style={styles.physicalRow}>
                <View style={styles.physicalValue}>
                  {weight != null ? (
                    <>
                      <Text style={[styles.statValue, { color: palette.text }]}>{weight}kg</Text>
                      <Text style={[styles.statLabel, { color: palette.secondary }]}>WEIGHT</Text>
                    </>
                  ) : null}
                </View>
                {isCaught ? (
                  <>
                    <View style={[styles.pipe, { backgroundColor: palette.divider }]} />
                    <View
                      accessibilityLabel={pokemonTypesAccessibilityLabel(displayTypeIconUris)}
                      accessible
                      style={styles.types}
                      testID={pokemonTypesTestId(displayTypeIconUris)}
                    >
                      {displayTypeIconUris.map((uri) => (
                        <Image fadeDuration={0}
                          accessibilityLabel={`${uri.match(/\/([^/?]+)\.png(?:\?|$)/i)?.[1] ?? 'Pokémon'} type`}
                          key={uri}
                          source={{ uri }}
                          style={styles.typeIcon}
                        />
                      ))}
                    </View>
                    <View style={[styles.pipe, { backgroundColor: palette.divider }]} />
                  </>
                ) : null}
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

            {!editing
              && isCaught
              && !instance?.mega
              && !instance?.is_mega
              && (detail.megaOptions?.length ?? 0) > 0 ? (
                <View accessibilityLabel="Mega Evolution available" accessible style={styles.megaEligibility}>
                  <Image fadeDuration={0}
                    accessibilityElementsHidden
                    source={{ uri: toAssetUrl(assetBaseUrl, '/images/mega.png') }}
                    style={styles.megaEligibilityIcon}
                  />
                  <Text style={styles.megaEligibilityText}>MEGA EVOLVE</Text>
                </View>
              ) : null}

            {!editing && (detail.moves.length || movesWarning) ? (
              <View style={[styles.section, { borderTopColor: palette.divider }]}>
                {detail.moves.length ? (
                  <NativeMovesPanel
                    assetBaseUrl={assetBaseUrl}
                    isShadow={Boolean(detail.instance?.shadow)}
                    moves={detail.moves}
                    palette={palette}
                  />
                ) : null}
                {movesWarning ? <Text style={styles.warningText}>{movesWarning}</Text> : null}
              </View>
            ) : null}

            {!editing && !isWanted && detail.ivs.length ? (
              <View style={[styles.section, { borderTopColor: palette.divider }]}>
                {detail.ivs.map((iv) => {
                  const full = iv.value >= 15;
                  const ivTextColor = full
                    ? light ? '#9b2e2e' : '#ef8582'
                    : light ? '#8a4b00' : '#ef9219';
                  return (
                  <View key={iv.label} style={styles.ivRow}>
                    <Text
                      adjustsFontSizeToFit
                      minimumFontScale={0.9}
                      numberOfLines={1}
                      style={[styles.ivLabel, { color: ivTextColor }]}
                    >
                      {iv.label}
                    </Text>
                    <View style={[styles.ivTrack, { backgroundColor: palette.track }]}>
                      <View style={[
                        styles.ivFill,
                        full && styles.ivFillFull,
                        { width: `${Math.max(0, Math.min(15, iv.value)) / 15 * 100}%` },
                      ]} />
                      <View style={styles.ivThird} />
                      <View style={styles.ivTwoThirds} />
                    </View>
                    <Text style={[styles.ivNumber, { color: ivTextColor }]}>{iv.value}</Text>
                  </View>
                  );
                })}
              </View>
            ) : null}

            {!editing && !isWanted && detail.preferences.length ? (
              <View style={[styles.preferencePanel, { borderColor: status.accent }]}>
                <Text style={[styles.preferenceTitle, { color: status.accent }]}>
                  {detail.row.status === 'wanted' ? 'WANTED CONDITIONS' : 'TRADE CONDITIONS'}
                </Text>
                <DetailRows rows={detail.preferences} secondaryColor={palette.secondary} textColor={palette.text} />
              </View>
            ) : null}

            {!editing && detail.provenance.length ? (
              <View style={[styles.metaSection, { borderTopColor: palette.divider }]}>
                <View style={[styles.metaPanel, { backgroundColor: palette.meta }]}>
                  {instance?.original_trainer_name ? (
                    <View style={styles.metaSummaryBlock}>
                      <Text style={[styles.metaSummaryLabel, { color: palette.secondary }]}>OBTAINED IN A TRADE</Text>
                      <Text style={[styles.metaSummaryValue, { color: palette.text }]}>{instance.original_trainer_name}</Text>
                    </View>
                  ) : null}
                  {instance?.location_caught || caughtDate ? (
                    <View style={styles.metaSummaryBlock}>
                      <Text style={[styles.metaSummaryLabel, { color: palette.secondary }]}>CAUGHT</Text>
                      {instance?.location_caught ? (
                        <Text style={[styles.metaSummaryValue, { color: palette.text }]}>{instance.location_caught}</Text>
                      ) : null}
                      {caughtDate ? (
                        <Text style={[styles.metaSummaryLabel, { color: palette.secondary }]}>{caughtDate}</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {!editing ? (
              <TargetSummary
                assetBaseUrl={assetBaseUrl}
                detail={detail}
                onEdit={() => onEditPreferences?.()}
                onOpenTarget={onOpenTarget}
                palette={palette}
                canEdit={canEdit}
              />
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
            {editError ? (
              <View accessibilityRole="alert" style={styles.saveError}>
                <Text style={styles.saveErrorText}>{editError}</Text>
              </View>
            ) : null}
          </View>
          </View>
        </ScrollView>
      </NativeInstanceSwipeFrame>

      {editing && !isWanted && canEdit ? (
        <Pressable
          accessibilityLabel="Save Pokémon"
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => void toggleEdit()}
          style={[
            styles.floatingSaveButton,
            {
              left: Math.max(12, (width - shellWidth) / 2 + 12),
              top: 30,
            },
          ]}
        >
          <Image fadeDuration={0}
            accessibilityElementsHidden
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/save-icon.png') }}
            style={[styles.editImage, styles.stageHeaderIcon]}
          />
        </Pressable>
      ) : null}

      <NativeBackgroundPicker
        assetBaseUrl={assetBaseUrl}
        onChange={(locationCard) => updateDraft({ locationCard })}
        onClose={() => setBackgroundPickerInstanceId(null)}
        open={backgroundPickerOpen}
        options={activeBackgroundOptions}
        palette={palette}
        selectedId={activeDraft.locationCard}
      />

      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        onPress={onBack}
        style={[styles.closeButton, { bottom: 18 }]}
      >
        <Image fadeDuration={0}
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
  input: '#242b2a',
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
  input: '#ffffff',
  panel: '#f7fbf8',
  secondary: '#58716c',
  text: '#173b42',
  targetCard: '#eef6f2',
  targetPanel: '#f0f5f2',
  track: '#d5dfdd',
};

const styles = StyleSheet.create({
  overlay: { flex: 1, overflow: 'hidden', backgroundColor: '#0f2b2b' },
  motionLayer: { flex: 1, overflow: 'hidden' },
  backgroundLayer: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  fullBackground: { ...StyleSheet.absoluteFill },
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
  floatingSaveButton: {
    position: 'absolute',
    zIndex: 30,
    top: 30,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(20,35,35,0.46)',
    elevation: 8,
  },
  editImage: { width: 42, height: 42 },
  stageHeaderIcon: {
    tintColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.42,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  cpText: {
    paddingTop: 3,
    color: '#ffffff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cpLabel: { fontSize: 16, lineHeight: 35 },
  cpLabelDesktop: { fontSize: 24, lineHeight: 50 },
  cpValue: { fontSize: 32, lineHeight: 35 },
  cpValueDesktop: { fontSize: 46, lineHeight: 50 },
  favoriteIcon: { color: '#ffffff', fontSize: 48, lineHeight: 50, fontWeight: '300' },
  favoriteSelected: { color: '#ffd000' },
  wantedBadge: { minHeight: 40, justifyContent: 'center', marginTop: 1, paddingHorizontal: 12, borderWidth: 1, borderColor: '#8b9997', borderRadius: 999, backgroundColor: 'rgba(53,61,61,0.82)' },
  mostWantedBadge: { borderColor: '#ff704d' },
  wantedBadgeText: { color: '#c5cdcb', fontSize: 12, fontWeight: '900' },
  mostWantedBadgeText: { color: '#ff8a63' },
  conditionsPanel: {
    zIndex: 8,
    width: '96.5%',
    gap: 5,
    marginBottom: 3,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 11,
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
  conditionBackgroundButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  conditionBackgroundImage: { width: 32, height: 32 },
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
  imageStage: { zIndex: 3, width: 296, height: 296, alignItems: 'center', justifyContent: 'center', marginTop: -48 },
  wantedImageStage: { width: 185, height: 185, marginTop: -8 },
  wantedImageStageDesktop: { width: 238, height: 238, marginTop: -18 },
  tradeImageStage: { width: 296, height: 296, marginTop: -48 },
  locationBackdrop: { position: 'absolute', top: -20, height: 292 },
  luckyBackdrop: { position: 'absolute', zIndex: 2, width: 296, height: 296 },
  wantedLuckyBackdrop: { width: 185, height: 185 },
  wantedLuckyBackdropDesktop: { width: 238, height: 238 },
  pokemonImage: { zIndex: 4, width: 290, height: 290 },
  wantedPokemonImage: { width: 181, height: 181 },
  wantedPokemonImageDesktop: { width: 233, height: 233 },
  tradePokemonImage: { width: 290, height: 290 },
  maxBadge: { position: 'absolute', zIndex: 5, top: 5, right: 5, width: 104, height: 104 },
  wantedMaxBadge: { top: 2, right: 2, width: 65, height: 65 },
  wantedMaxBadgeDesktop: { top: 3, right: 3, width: 83, height: 83 },
  purifiedBadge: { position: 'absolute', zIndex: 5, bottom: 5, left: 5, width: 54, height: 54 },
  detailsPanel: { width: '100%', minHeight: 300, alignItems: 'center', marginTop: -51, paddingTop: 64, paddingBottom: 18, borderRadius: 12, overflow: 'hidden' },
  wantedDetailsPanel: { marginTop: -42, paddingTop: 43 },
  wantedDetailsPanelDesktop: { marginTop: -85, paddingTop: 43 },
  tradeDetailsPanel: { marginTop: -60, paddingTop: 67 },
  caughtDateBadge: {
    position: 'absolute',
    zIndex: 4,
    top: 12,
    right: 5,
    minWidth: 67,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#f4be5c',
  },
  caughtDateBall: { width: 19, height: 19 },
  caughtDateYear: { color: '#422b00', fontSize: 12, lineHeight: 13, fontWeight: '900', textAlign: 'center' },
  caughtDateDay: { color: '#422b00', fontSize: 10, lineHeight: 11, fontWeight: '800', textAlign: 'center' },
  statusEyebrow: { marginBottom: 4, fontSize: 12, fontWeight: '900', letterSpacing: 1.7 },
  name: { maxWidth: '92%', fontSize: 32, lineHeight: 35, fontWeight: '500', textAlign: 'center' },
  nameDesktop: { fontSize: 52, lineHeight: 55 },
  megaEligibility: {
    minHeight: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#319779',
  },
  megaEligibilityIcon: { width: 22, height: 22 },
  megaEligibilityText: { color: '#061f17', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  editFields: { width: '94%', gap: 14, paddingTop: 3 },
  editFieldGroup: { width: '100%', gap: 6 },
  editFieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  editInput: {
    minHeight: 44,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '700',
  },
  editNameInput: { minHeight: 48, fontSize: 25, textAlign: 'center' },
  editTwoColumns: { width: '100%', flexDirection: 'row', gap: 10 },
  editMeasurements: { width: '100%', flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  editThreeColumns: { width: '100%', flexDirection: 'row', gap: 8 },
  editColumn: { flex: 1, minWidth: 0, gap: 4 },
  editTypes: {
    width: 58,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  editTypeIcon: { width: 24, height: 24 },
  inlineInputLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  genderOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  genderOption: {
    minHeight: 42,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 9,
  },
  genderOptionSelected: { backgroundColor: 'rgba(40,137,226,0.23)' },
  genderOptionText: { fontSize: 12, fontWeight: '900' },
  booleanOptions: { flexDirection: 'row', gap: 7 },
  booleanOption: {
    minHeight: 42,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9,
  },
  booleanOptionSelected: { backgroundColor: 'rgba(40,137,226,0.23)' },
  booleanOptionText: { fontSize: 12, fontWeight: '900' },
  disabledOption: { opacity: 0.42 },
  editHelpText: { fontSize: 12, lineHeight: 17 },
  powerPanel: {
    width: '100%',
    gap: 12,
    padding: 11,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(127,145,141,0.09)',
  },
  powerTitle: { fontSize: 14, fontWeight: '900' },
  powerFormOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  powerFormOption: {
    width: '31.8%',
    minWidth: 92,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 9,
  },
  powerFormOptionSelected: { backgroundColor: 'rgba(40,137,226,0.18)' },
  powerFormOptionDisabled: { opacity: 0.45 },
  powerFormImage: { width: 62, height: 62 },
  powerFormLabel: { fontSize: 11, lineHeight: 13, fontWeight: '900', textAlign: 'center' },
  fusionPartnerPanel: { gap: 7, paddingTop: 2 },
  shadowOptionSelected: { backgroundColor: 'rgba(103,76,184,0.25)' },
  maxMovesPanel: { width: '100%', gap: 9 },
  maxMovesHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  maxMovesIcon: { width: 34, height: 34 },
  maxMoveRow: { width: '100%', gap: 5 },
  maxMoveLabel: { fontSize: 12, fontWeight: '900' },
  maxMoveOptions: { flexDirection: 'row', gap: 6 },
  maxMoveOption: {
    minHeight: 40,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  maxMoveOptionSelected: { backgroundColor: 'rgba(214,41,143,0.18)' },
  maxMoveOptionText: { fontSize: 11, fontWeight: '900' },
  editMetaPanel: {
    width: '100%',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(127,145,141,0.09)',
  },
  locationSuggestionStatus: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationSuggestionStatusText: { fontSize: 12, fontWeight: '700' },
  locationSuggestionError: { color: '#ff7188', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  locationInputWrapper: { gap: 6 },
  locationSuggestions: {
    maxHeight: 210,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 9,
  },
  locationSuggestion: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationSuggestionPressed: { backgroundColor: 'rgba(56,169,255,0.14)' },
  locationSuggestionPin: { width: 18, fontSize: 20, lineHeight: 22, fontWeight: '900', textAlign: 'center' },
  locationSuggestionText: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 19, fontWeight: '800' },
  ballOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ballOption: {
    minHeight: 38,
    flexGrow: 1,
    minWidth: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  ballOptionText: { fontSize: 10, fontWeight: '900' },
  choiceField: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: 9,
  },
  choiceFieldTypeIcon: { width: 24, height: 24, flexShrink: 0 },
  choiceFieldCopy: { flex: 1, minWidth: 0, gap: 2 },
  choiceFieldValue: { fontSize: 15, fontWeight: '800' },
  choiceFieldPower: { minWidth: 34, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  choiceChevron: { fontSize: 25, lineHeight: 26 },
  choiceModalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.66)' },
  choiceModalSheet: {
    maxHeight: '82%',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
    borderWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  choiceModalHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  choiceModalEyebrow: { color: '#2e9eff', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  choiceModalTitle: { fontSize: 23, fontWeight: '900' },
  choiceModalClose: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 22 },
  choiceModalCloseText: { fontSize: 28, lineHeight: 30 },
  choiceList: { marginTop: 8 },
  choiceOption: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 10 },
  choiceOptionSelected: { backgroundColor: 'rgba(46,158,255,0.13)' },
  choiceOptionTypeIcon: { width: 25, height: 25, flexShrink: 0 },
  choiceOptionCopy: { flex: 1, minWidth: 0 },
  choiceOptionName: { fontSize: 15, fontWeight: '900' },
  choiceOptionMeta: { marginTop: 2, fontSize: 12 },
  choiceOptionPower: { minWidth: 34, fontSize: 14, fontWeight: '900', textAlign: 'right' },
  choiceCheck: { color: '#43c995', fontSize: 22, fontWeight: '900' },
  sizePreferenceRow: { gap: 5 },
  sizePreferenceLabel: { paddingLeft: 2 },
  sizeOptions: { flexDirection: 'row', gap: 5 },
  sizeOption: { minHeight: 42, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 8 },
  sizeOptionSelected: { backgroundColor: 'rgba(255,97,125,0.16)' },
  sizeOptionText: { fontSize: 12, fontWeight: '900' },
  backgroundGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 10, paddingBottom: 20 },
  backgroundOption: { width: '48.5%', height: 150, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 12 },
  backgroundOptionCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 40, justifyContent: 'center', paddingHorizontal: 7, backgroundColor: 'rgba(0,0,0,0.72)' },
  backgroundOptionName: { fontSize: 12, fontWeight: '900', textAlign: 'center' },
  backgroundOptionImageName: { color: '#ffffff' },
  noBackgroundIcon: { width: 54, height: 54, marginBottom: 7 },
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
  moveTabs: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 },
  moveTabButton: { minHeight: 38, justifyContent: 'flex-end', paddingHorizontal: 4 },
  moveTabActive: { paddingBottom: 4, borderBottomWidth: 2, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  moveTab: { paddingBottom: 6, borderBottomWidth: 2, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  nativeMovesPanel: { width: '100%', overflow: 'hidden' },
  nativeMoveBlock: { width: '100%', marginBottom: 5 },
  nativeMoveRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 5 },
  nativeMoveIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  nativeMoveTypeIcon: { width: 22, height: 22, flexShrink: 0 },
  nativeMoveName: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '600' },
  nativeMovePower: { minWidth: 48, fontSize: 16, fontVariant: ['tabular-nums'], textAlign: 'right' },
  nativeMovePowerBonus: { color: '#4ea5ff', fontWeight: '800' },
  nativeShadowBonusRow: { minHeight: 16, flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 35 },
  nativeShadowBonusIconBadge: { width: 15, height: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4ea5ff', borderRadius: 8 },
  nativeShadowBonusIcon: { width: 11, height: 11 },
  nativeShadowBonusText: { color: '#d07cff', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  detailRows: { width: '100%' },
  detailRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  detailLabel: { width: 104, flexShrink: 0, fontSize: 16, fontWeight: '600' },
  detailValue: { minWidth: 0, flex: 1, fontSize: 16, fontWeight: '800', textAlign: 'right' },
  warningText: { color: '#ffd18a', paddingHorizontal: 8, lineHeight: 19 },
  ivRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4 },
  ivLabel: { width: 82, fontSize: 16, fontWeight: '700' },
  ivTrack: { flex: 1, height: 14, overflow: 'hidden', borderRadius: 7 },
  ivFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 7, backgroundColor: '#ff9d23' },
  ivFillFull: { backgroundColor: '#d96562' },
  ivThird: { position: 'absolute', left: '33.333%', width: 2, top: 0, bottom: 0, backgroundColor: '#ffffff' },
  ivTwoThirds: { position: 'absolute', left: '66.666%', width: 2, top: 0, bottom: 0, backgroundColor: '#ffffff' },
  ivNumber: { width: 24, fontSize: 16, textAlign: 'right' },
  preferencePanel: { width: '94%', marginTop: 14, gap: 4, padding: 10, borderWidth: 1, borderRadius: 12 },
  preferenceTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  metaSection: { width: '94%', marginTop: 16, paddingTop: 18, borderTopWidth: 2 },
  metaPanel: { width: '100%', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  metaSummaryBlock: { width: '100%', alignItems: 'flex-start' },
  metaSummaryLabel: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.4 },
  metaSummaryValue: { marginVertical: 3, fontSize: 16, lineHeight: 19 },
  targetsPanel: {
    width: '94%',
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
  },
  targetsPanelTrade: { marginTop: 29 },
  targetsHeading: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetsTitle: { flex: 1, fontSize: 16, fontWeight: '900' },
  targetCount: { minWidth: 34, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 13 },
  targetCountText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  targetGridViewport: { marginTop: 5 },
  targetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingBottom: 3 },
  targetCard: {
    width: '31.8%',
    minHeight: 161,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  targetCardPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  targetImageStage: { width: '100%', height: 101, alignItems: 'center', justifyContent: 'center' },
  targetLuckyBackdrop: { position: 'absolute', width: 102, height: 102 },
  targetImage: { width: 94, height: 94 },
  targetMaxBadge: { position: 'absolute', top: 0, right: 0, width: 31, height: 31 },
  targetName: { minHeight: 32, fontSize: 12, lineHeight: 15, fontWeight: '900', textAlign: 'center' },
  targetDex: { marginTop: 3, fontSize: 10 },
  noTargets: { paddingVertical: 18, textAlign: 'center' },
  editPreferencesButton: { width: '94%', minHeight: 40, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 5, borderRadius: 10 },
  editPreferencesText: { color: '#07130d', fontSize: 14, fontWeight: '900' },
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
