import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { useState } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { NativeInstanceDetail } from '../features/collection/collectionModel';
import type { NativeInstanceDetailPatch } from '../features/collection/nativeInstanceDetailMutation';
import type {
  PokemonSizeClass,
  WantedSizePreferences,
  WantedSizeRange,
} from '@pokemongonexus/shared-contracts/instances';
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
  onOpenTarget?: (instanceId: string) => void;
  onToggleFavorite: (favorite: boolean) => void;
  onEditInCurrentApp: () => void;
  onEditPreferences?: () => void;
  onSaveDetails?: (patch: NativeInstanceDetailPatch) => Promise<unknown>;
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
};

const editableNumber = (value: unknown): string => (
  typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
);

const resolveWantedSizeClass = (
  detail: NativeInstanceDetail,
  metric: 'weight' | 'height',
): PokemonSizeClass | null => {
  const stored = detail.instance?.wanted_size_preferences?.[metric]?.category;
  if (stored) return stored;
  const value = detail.instance?.[metric];
  const sizes = detail.sizeThresholds;
  if (value == null || !sizes) return null;
  if (value < sizes[`${metric}_xxs_threshold`]) return 'XXS';
  if (value < sizes[`${metric}_xs_threshold`]) return 'XS';
  if (value > sizes[`${metric}_xxl_threshold`]) return 'XXL';
  if (value > sizes[`${metric}_xl_threshold`]) return 'XL';
  return null;
};

const createEditDraft = (detail: NativeInstanceDetail): NativeInstanceEditDraft => ({
  nickname: detail.instance?.nickname
    ?? detail.row.name.trim().split(/\s+/).at(-1)
    ?? detail.row.name,
  cp: editableNumber(detail.instance?.cp),
  level: editableNumber(detail.instance?.level),
  gender: detail.instance?.gender ?? null,
  weight: editableNumber(detail.instance?.weight),
  height: editableNumber(detail.instance?.height),
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
});

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

const primaryTypeName = (detail: NativeInstanceDetail): string => {
  const match = detail.row.typeIconUris[0]?.match(/\/([^/?]+)\.png(?:\?|$)/i);
  return match?.[1]?.toLowerCase() ?? 'normal';
};

const backgroundPath = (
  detail: NativeInstanceDetail,
  wantedLuckyOverride?: boolean,
): string => {
  const instance = detail.instance;
  if (instance?.shadow && !instance.purified) return '/images/backgrounds/bg_shadow.png';
  if (
    detail.row.lucky
    || instance?.lucky
    || (instance?.is_wanted && (wantedLuckyOverride ?? instance.pref_lucky))
  ) {
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
  editing,
  draft,
  onDraftChange,
  canPickBackground,
  onOpenBackground,
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
        <Pressable
          accessibilityLabel={editing ? 'Save wanted listing' : 'Edit wanted listing'}
          accessibilityRole="button"
          onPress={onEdit}
          style={styles.conditionEditButton}
        >
          <Image
            accessibilityElementsHidden
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, editing ? '/images/save-icon.png' : '/images/edit-icon.png') }}
            style={[styles.conditionEditImage, { tintColor: palette.text }]}
          />
        </Pressable>
        <View style={styles.conditionsHeadingCopy}>
          <Text style={styles.conditionsTitle}>WANTED CONDITIONS</Text>
          <Text style={[styles.conditionsSubtitle, { color: palette.secondary }]}>Friendship and eligibility</Text>
        </View>
        {editing && canPickBackground ? (
          <Pressable
            accessibilityLabel="Choose location background"
            accessibilityRole="button"
            onPress={onOpenBackground}
            style={styles.conditionBackgroundButton}
          >
            <Image
              accessibilityElementsHidden
              resizeMode="contain"
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/location.png') }}
              style={[styles.conditionBackgroundImage, { tintColor: palette.text }]}
            />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel={mostWanted ? 'Remove Most Wanted' : 'Mark as Most Wanted'}
          accessibilityRole={editing ? 'button' : undefined}
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
              accessibilityRole={editing ? 'button' : undefined}
              disabled={!editing}
              key={index}
              onPress={() => onDraftChange({ friendship: index + 1 })}
            >
              <Image
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
          accessibilityRole={editing ? 'button' : undefined}
          disabled={!editing}
          onPress={() => onDraftChange({ prefLucky: !luckyRequested })}
        >
          <Image
            accessibilityElementsHidden
            resizeMode="contain"
            source={{ uri: toAssetUrl(assetBaseUrl, '/images/lucky_friend_icon.png') }}
            style={[styles.friendshipBadgeIcon, !luckyRequested && styles.inactiveConditionIcon]}
          />
        </Pressable>
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
  </Pressable>
);

const TargetSummary = ({
  assetBaseUrl,
  detail,
  palette,
  onEdit,
  onOpenTarget,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail;
  palette: typeof LIGHT;
  onEdit: () => void;
  onOpenTarget?: (instanceId: string) => void;
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
              <TargetCard
                assetBaseUrl={assetBaseUrl}
                key={row.id}
                onPress={onOpenTarget ? () => onOpenTarget(row.id) : undefined}
                palette={palette}
                row={row}
              />
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

const NativeMoveSelector = ({
  label,
  options,
  palette,
  value,
  onChange,
}: {
  label: string;
  options: NonNullable<NativeInstanceDetail['moveOptions']>;
  palette: typeof LIGHT;
  value: number | null;
  onChange: (value: number | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);
  return (
    <>
      <Pressable
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.choiceField, { backgroundColor: palette.input, borderColor: palette.border }]}
      >
        <View style={styles.choiceFieldCopy}>
          <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>{label.toUpperCase()}</Text>
          <Text numberOfLines={1} style={[styles.choiceFieldValue, { color: palette.text }]}>
            {selected?.name ?? 'Unselected move'}
          </Text>
        </View>
        <Text style={[styles.choiceChevron, { color: palette.secondary }]}>⌄</Text>
      </Pressable>
      <Modal
        animationType="slide"
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
                  <View style={styles.choiceOptionCopy}>
                    <Text style={[styles.choiceOptionName, { color: palette.text }]}>{option.name}</Text>
                    <Text style={[styles.choiceOptionMeta, { color: palette.secondary }]}>
                      {option.typeName}{option.legacy ? ' · Legacy' : ''}
                    </Text>
                  </View>
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
  detail,
  open,
  palette,
  selectedId,
  onChange,
  onClose,
}: {
  assetBaseUrl: string;
  detail: NativeInstanceDetail;
  open: boolean;
  palette: typeof LIGHT;
  selectedId: string | null;
  onChange: (value: string | null) => void;
  onClose: () => void;
}) => (
  <Modal
    animationType="slide"
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
            <Image
              accessibilityElementsHidden
              resizeMode="contain"
              source={{ uri: toAssetUrl(assetBaseUrl, '/images/location.png') }}
              style={[styles.noBackgroundIcon, { tintColor: palette.secondary }]}
            />
            <Text style={[styles.backgroundOptionName, { color: palette.text }]}>None</Text>
          </Pressable>
          {(detail.backgroundOptions ?? []).map((option) => (
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

const NativeInstanceEditFields = ({
  detail,
  draft,
  isWanted,
  palette,
  onChange,
}: {
  detail: NativeInstanceDetail;
  draft: NativeInstanceEditDraft;
  isWanted: boolean;
  palette: typeof LIGHT;
  onChange: (patch: Partial<NativeInstanceEditDraft>) => void;
}) => {
  const inputStyle = [
    styles.editInput,
    { backgroundColor: palette.input, borderColor: palette.border, color: palette.text },
  ];
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
        <View style={styles.editTwoColumns}>
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
        <NativeMoveSelector
          label="Fast move"
          onChange={(fastMove) => onChange({ fastMove })}
          options={(detail.moveOptions ?? []).filter((move) => move.kind === 'fast')}
          palette={palette}
          value={draft.fastMove}
        />
        <NativeMoveSelector
          label="Charged move"
          onChange={(chargedMove1) => onChange({ chargedMove1 })}
          options={(detail.moveOptions ?? []).filter((move) => move.kind === 'charged')}
          palette={palette}
          value={draft.chargedMove1}
        />
        <NativeMoveSelector
          label="Second charged move"
          onChange={(chargedMove2) => onChange({ chargedMove2 })}
          options={(detail.moveOptions ?? []).filter((move) => move.kind === 'charged')}
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

          <View style={styles.editFieldGroup}>
            <Text style={[styles.editFieldLabel, { color: palette.secondary }]}>CAUGHT DETAILS</Text>
            <TextInput
              accessibilityLabel="Caught location"
              autoCapitalize="words"
              onChangeText={(locationCaught) => onChange({ locationCaught })}
              placeholder="Location caught"
              placeholderTextColor={palette.secondary}
              style={inputStyle}
              value={draft.locationCaught}
            />
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
        </>
      ) : null}
    </View>
  );
};

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
}: Props) => {
  const light = useColorScheme() === 'light';
  const { width } = useWindowDimensions();
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
  const editing = editingInstanceId === detail.row.id;
  const activeDraft = draftState?.instanceId === detail.row.id
    ? draftState.value
    : createEditDraft(detail);
  const editError = editErrorState?.instanceId === detail.row.id
    ? editErrorState.message
    : null;
  const backgroundPickerOpen = backgroundPickerInstanceId === detail.row.id;
  const selectedLocationBackgroundUri = editing
    ? detail.backgroundOptions?.find((option) => String(option.id) === activeDraft.locationCard)?.imageUri ?? null
    : detail.row.locationBackgroundUri;
  const updateDraft = (patch: Partial<NativeInstanceEditDraft>) => {
    setDraftState((current) => ({
      instanceId: detail.row.id,
      value: {
        ...(current?.instanceId === detail.row.id ? current.value : createEditDraft(detail)),
        ...patch,
      },
    }));
  };
  const toggleEdit = async () => {
    if (!onSaveDetails) {
      onEditInCurrentApp();
      return;
    }
    if (!editing) {
      setDraftState({ instanceId: detail.row.id, value: createEditDraft(detail) });
      setEditErrorState(null);
      setEditingInstanceId(detail.row.id);
      return;
    }
    try {
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
            cp: nullableNumber(activeDraft.cp),
            level: nullableNumber(activeDraft.level),
            gender: activeDraft.gender,
            weight: nullableNumber(activeDraft.weight),
            height: nullableNumber(activeDraft.height),
            attack_iv: nullableNumber(activeDraft.attackIv),
            defense_iv: nullableNumber(activeDraft.defenseIv),
            stamina_iv: nullableNumber(activeDraft.staminaIv),
            location_caught: activeDraft.locationCaught,
            date_caught: activeDraft.dateCaught,
            fast_move_id: activeDraft.fastMove,
            charged_move1_id: activeDraft.chargedMove1,
            charged_move2_id: activeDraft.chargedMove2,
            location_card: activeDraft.locationCard,
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
      <Image
        accessibilityElementsHidden
        blurRadius={3}
        resizeMode="cover"
        source={{
          uri: toAssetUrl(
            assetBaseUrl,
            backgroundPath(detail, editing && isWanted ? activeDraft.prefLucky : undefined),
          ),
        }}
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
              draft={activeDraft}
              editing={editing}
              canPickBackground={(detail.backgroundOptions?.length ?? 0) > 0}
              onDraftChange={updateDraft}
              onEdit={() => void toggleEdit()}
              onOpenBackground={() => setBackgroundPickerInstanceId(detail.row.id)}
              palette={palette}
            />
          ) : (
            <View style={styles.headerRow}>
              <Pressable
                accessibilityLabel={editing ? 'Save Pokémon' : 'Edit Pokémon'}
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => void toggleEdit()}
                style={styles.iconButton}
              >
                <Image
                  accessibilityElementsHidden
                  resizeMode="contain"
                  source={{ uri: toAssetUrl(assetBaseUrl, editing ? '/images/save-icon.png' : '/images/edit-icon.png') }}
                  style={[styles.editImage, { tintColor: palette.text }]}
                />
              </Pressable>
              {isCaught && cp != null && !editing ? (
                <Text style={[styles.cpText, { color: palette.text }]}>CP{cp}</Text>
              ) : <View />}
              {editing ? (
                (detail.backgroundOptions?.length ?? 0) > 0 ? (
                  <Pressable
                    accessibilityLabel="Choose location background"
                    accessibilityRole="button"
                    onPress={() => setBackgroundPickerInstanceId(detail.row.id)}
                    style={styles.iconButton}
                  >
                    <Image
                      accessibilityElementsHidden
                      resizeMode="contain"
                      source={{ uri: toAssetUrl(assetBaseUrl, '/images/location.png') }}
                      style={[styles.editImage, { tintColor: palette.text }]}
                    />
                  </Pressable>
                ) : <View style={styles.iconButton} />
              ) : isCaught ? (
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
            {selectedLocationBackgroundUri ? (
              <View style={[styles.locationBackdrop, { width: Math.min(shellWidth, 447) }]}>
                <NativePokemonLocationBackdrop uri={selectedLocationBackgroundUri} />
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
            {editing ? (
              <NativeInstanceEditFields
                detail={detail}
                draft={activeDraft}
                isWanted={isWanted}
                onChange={updateDraft}
                palette={palette}
              />
            ) : (
              <Text accessibilityRole="header" style={[styles.name, { color: palette.text }]}>
                {detail.row.name}
              </Text>
            )}

            {!editing && (isCaught || gender) ? (
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

            {!editing && isCaught && showPhysicalRow ? (
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

            {!editing && (detail.moves.length || movesWarning) ? (
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

            {!editing && isCaught && detail.ivs.length ? (
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

            {!editing && !isWanted && detail.preferences.length ? (
              <View style={[styles.preferencePanel, { borderColor: status.accent }]}>
                <Text style={[styles.preferenceTitle, { color: status.accent }]}>
                  {detail.row.status === 'wanted' ? 'WANTED CONDITIONS' : 'TRADE CONDITIONS'}
                </Text>
                <DetailRows rows={detail.preferences} secondaryColor={palette.secondary} textColor={palette.text} />
              </View>
            ) : null}

            {!editing && detail.provenance.length ? (
              <View style={[styles.metaPanel, { backgroundColor: palette.meta }]}>
                <DetailRows rows={detail.provenance} secondaryColor={palette.secondary} textColor={palette.text} />
              </View>
            ) : null}

            {!editing ? (
              <TargetSummary
                assetBaseUrl={assetBaseUrl}
                detail={detail}
                onEdit={onEditPreferences ?? onEditInCurrentApp}
                onOpenTarget={onOpenTarget}
                palette={palette}
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

      <NativeBackgroundPicker
        assetBaseUrl={assetBaseUrl}
        detail={detail}
        onChange={(locationCard) => updateDraft({ locationCard })}
        onClose={() => setBackgroundPickerInstanceId(null)}
        open={backgroundPickerOpen}
        palette={palette}
        selectedId={activeDraft.locationCard}
      />

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
  editThreeColumns: { width: '100%', flexDirection: 'row', gap: 8 },
  editColumn: { flex: 1, minWidth: 0, gap: 4 },
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
  choiceFieldCopy: { flex: 1, minWidth: 0, gap: 2 },
  choiceFieldValue: { fontSize: 15, fontWeight: '800' },
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
  choiceOptionCopy: { flex: 1, minWidth: 0 },
  choiceOptionName: { fontSize: 15, fontWeight: '900' },
  choiceOptionMeta: { marginTop: 2, fontSize: 12 },
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
  targetCardPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
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
