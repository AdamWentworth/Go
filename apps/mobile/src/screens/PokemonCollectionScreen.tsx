import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';
import type { InstancesMap, PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import { useAuth } from '../features/auth/AuthProvider';
import { useEvents } from '../features/events/EventsProvider';
import {
  mutateInstanceAddTag,
  mutateInstanceAura,
  mutateInstanceBattleStats,
  mutateInstanceCaughtDetails,
  mutateInstanceClearTags,
  mutateInstanceFavorite,
  mutateInstanceFusion,
  mutateInstanceLocationDetails,
  mutateInstanceMaxStats,
  mutateInstanceMega,
  mutateInstanceMostWanted,
  mutateInstanceMoves,
  mutateInstanceNickname,
  mutateInstanceRemoveTag,
  mutateInstanceStatus,
  toReceiverPokemonPayload,
  type InstanceStatusMutation,
} from '../features/instances/instanceMutations';
import {
  filterInstancesByOwnership,
  toInstanceListItems,
  type InstanceListItem,
} from '../features/instances/instanceReadModels';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { sendPokemonUpdate } from '../services/receiverService';
import { fetchForeignInstancesByUsername } from '../services/userSearchService';
import { fetchUserOverview } from '../services/userOverviewService';
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type PokemonCollectionScreenProps = NativeStackScreenProps<RootStackParamList, 'PokemonCollection'>;

const OWNERSHIP_MODES: OwnershipMode[] = ['caught', 'trade', 'wanted'];
const TAG_BUCKETS: ('caught' | 'trade' | 'wanted')[] = ['caught', 'trade', 'wanted'];
const GENDER_OPTIONS = ['male', 'female', 'genderless', 'unknown'] as const;
const EDITOR_SECTIONS = ['status', 'attributes', 'tags'] as const;
const MAX_ROWS = 120;
const MAX_NICKNAME_LENGTH = 12;
const MAX_TAG_LENGTH = 40;
const MIN_IV = 0;
const MAX_IV = 15;
const MIN_LEVEL = 1;
const MAX_LEVEL = 50;
const MIN_MAX_LEVEL = 0;
const MAX_MAX_LEVEL = 3;
const DATE_CAUGHT_FORMAT = 'YYYY-MM-DD';
const MAX_LOCATION_FIELD_LENGTH = 255;
const EVENT_REFRESH_COOLDOWN_MS = 1500;
type EditorSection = (typeof EDITOR_SECTIONS)[number];

const summarize = (items: InstanceListItem[]) => {
  let caught = 0;
  let trade = 0;
  let wanted = 0;
  for (const item of items) {
    if (item.isCaught) caught += 1;
    if (item.isForTrade) trade += 1;
    if (item.isWanted) wanted += 1;
  }
  return { total: items.length, caught, trade, wanted };
};

const toMutableInstance = (instanceId: string, instance: PokemonInstance): PokemonInstance => ({
  ...instance,
  instance_id: instance.instance_id ?? instanceId,
});

const toTagBucketLabel = (bucket: 'caught' | 'trade' | 'wanted'): string =>
  bucket.charAt(0).toUpperCase() + bucket.slice(1);

const getBucketTags = (
  instance: PokemonInstance,
  bucket: 'caught' | 'trade' | 'wanted',
): string[] => {
  if (bucket === 'caught') return instance.caught_tags ?? [];
  if (bucket === 'trade') return instance.trade_tags ?? [];
  return instance.wanted_tags ?? [];
};

const parseOptionalInteger = (value: string): number | null | 'invalid' => {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^-?\d+$/.test(normalized)) return 'invalid';
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 'invalid';
};

const parseOptionalDecimal = (value: string): number | null | 'invalid' => {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 'invalid';
  return parsed;
};

const normalizeGender = (value: string | null | undefined): string | null => {
  const normalized = (value ?? '').trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const isValidDateCaught = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};

export const PokemonCollectionScreen = ({ navigation, route }: PokemonCollectionScreenProps) => {
  const { user } = useAuth();
  const { eventVersion, latestUpdate, syncing: eventsSyncing } = useEvents();
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('caught');
  const [usernameInput, setUsernameInput] = useState(route.params?.username ?? '');
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [instancesMap, setInstancesMap] = useState<InstancesMap>({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [editorSection, setEditorSection] = useState<EditorSection>('status');
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [cpDraft, setCpDraft] = useState('');
  const [levelDraft, setLevelDraft] = useState('');
  const [attackIvDraft, setAttackIvDraft] = useState('');
  const [defenseIvDraft, setDefenseIvDraft] = useState('');
  const [staminaIvDraft, setStaminaIvDraft] = useState('');
  const [fastMoveIdDraft, setFastMoveIdDraft] = useState('');
  const [chargedMove1IdDraft, setChargedMove1IdDraft] = useState('');
  const [chargedMove2IdDraft, setChargedMove2IdDraft] = useState('');
  const [genderDraft, setGenderDraft] = useState('');
  const [dateCaughtDraft, setDateCaughtDraft] = useState('');
  const [isLuckyDraft, setIsLuckyDraft] = useState(false);
  const [isShadowDraft, setIsShadowDraft] = useState(false);
  const [isPurifiedDraft, setIsPurifiedDraft] = useState(false);
  const [locationCaughtDraft, setLocationCaughtDraft] = useState('');
  const [locationCardDraft, setLocationCardDraft] = useState('');
  const [maxAttackDraft, setMaxAttackDraft] = useState('');
  const [maxGuardDraft, setMaxGuardDraft] = useState('');
  const [maxSpiritDraft, setMaxSpiritDraft] = useState('');
  const [megaFormDraft, setMegaFormDraft] = useState('');
  const [fusionFormDraft, setFusionFormDraft] = useState('');
  const [tagBucketDraft, setTagBucketDraft] = useState<'caught' | 'trade' | 'wanted'>('caught');
  const [tagDraft, setTagDraft] = useState('');
  const lastEventRefreshAtRef = useRef(0);

  const items = useMemo(() => toInstanceListItems(instancesMap), [instancesMap]);

  const selectedInstance = useMemo(
    () => (selectedInstanceId ? instancesMap[selectedInstanceId] ?? null : null),
    [instancesMap, selectedInstanceId],
  );

  const isOwnCollection = useMemo(() => {
    if (!activeUsername || !user?.username) return false;
    return activeUsername.toLowerCase() === user.username.toLowerCase();
  }, [activeUsername, user?.username]);

  const selectedStatusHint = useMemo(() => {
    if (!selectedInstance) return 'Select an instance to view status details.';
    if (selectedInstance.is_for_trade) return 'This instance is caught and listed for trade.';
    if (selectedInstance.is_wanted) return 'This instance is marked wanted (not caught).';
    if (selectedInstance.is_caught) return 'This instance is caught and not listed for trade.';
    return 'This instance is currently missing/unset.';
  }, [selectedInstance]);

  const selectedBucketTags = useMemo(() => {
    if (!selectedInstance) return [];
    return getBucketTags(selectedInstance, tagBucketDraft);
  }, [selectedInstance, tagBucketDraft]);
  const normalizedNicknameDraft = nicknameDraft.trim();
  const currentNickname = useMemo(
    () => (selectedInstance?.nickname ? selectedInstance.nickname.trim() : ''),
    [selectedInstance],
  );
  const nicknameLength = normalizedNicknameDraft.length;
  const nicknameTooLong = nicknameLength > MAX_NICKNAME_LENGTH;
  const nicknameUnchanged = normalizedNicknameDraft === currentNickname;
  const normalizedTagDraft = tagDraft.trim();
  const tagLength = normalizedTagDraft.length;
  const tagTooLong = tagLength > MAX_TAG_LENGTH;
  const duplicateTagInBucket = useMemo(
    () =>
      normalizedTagDraft.length > 0 &&
      selectedBucketTags.some((tag) => tag.toLowerCase() === normalizedTagDraft.toLowerCase()),
    [normalizedTagDraft, selectedBucketTags],
  );
  const parsedCp = useMemo(() => parseOptionalInteger(cpDraft), [cpDraft]);
  const parsedLevel = useMemo(() => parseOptionalDecimal(levelDraft), [levelDraft]);
  const parsedAttackIv = useMemo(() => parseOptionalInteger(attackIvDraft), [attackIvDraft]);
  const parsedDefenseIv = useMemo(() => parseOptionalInteger(defenseIvDraft), [defenseIvDraft]);
  const parsedStaminaIv = useMemo(() => parseOptionalInteger(staminaIvDraft), [staminaIvDraft]);
  const parsedFastMoveId = useMemo(() => parseOptionalInteger(fastMoveIdDraft), [fastMoveIdDraft]);
  const parsedChargedMove1Id = useMemo(
    () => parseOptionalInteger(chargedMove1IdDraft),
    [chargedMove1IdDraft],
  );
  const parsedChargedMove2Id = useMemo(
    () => parseOptionalInteger(chargedMove2IdDraft),
    [chargedMove2IdDraft],
  );
  const normalizedGenderDraft = useMemo(() => normalizeGender(genderDraft), [genderDraft]);
  const normalizedDateCaughtDraft = useMemo(() => dateCaughtDraft.trim(), [dateCaughtDraft]);
  const parsedMaxAttack = useMemo(() => parseOptionalInteger(maxAttackDraft), [maxAttackDraft]);
  const parsedMaxGuard = useMemo(() => parseOptionalInteger(maxGuardDraft), [maxGuardDraft]);
  const parsedMaxSpirit = useMemo(() => parseOptionalInteger(maxSpiritDraft), [maxSpiritDraft]);

  const battleStatsValidationError = useMemo(() => {
    if (parsedCp === 'invalid') return 'CP must be a whole number.';
    if (typeof parsedCp === 'number' && parsedCp < 0) return 'CP must be 0 or greater.';

    if (parsedLevel === 'invalid') return 'Level must be a number.';
    if (
      typeof parsedLevel === 'number' &&
      (parsedLevel < MIN_LEVEL || parsedLevel > MAX_LEVEL)
    ) {
      return `Level must be between ${MIN_LEVEL} and ${MAX_LEVEL}.`;
    }

    if (parsedAttackIv === 'invalid') return 'Attack IV must be a whole number.';
    if (
      typeof parsedAttackIv === 'number' &&
      (parsedAttackIv < MIN_IV || parsedAttackIv > MAX_IV)
    ) {
      return `Attack IV must be between ${MIN_IV} and ${MAX_IV}.`;
    }

    if (parsedDefenseIv === 'invalid') return 'Defense IV must be a whole number.';
    if (
      typeof parsedDefenseIv === 'number' &&
      (parsedDefenseIv < MIN_IV || parsedDefenseIv > MAX_IV)
    ) {
      return `Defense IV must be between ${MIN_IV} and ${MAX_IV}.`;
    }

    if (parsedStaminaIv === 'invalid') return 'Stamina IV must be a whole number.';
    if (
      typeof parsedStaminaIv === 'number' &&
      (parsedStaminaIv < MIN_IV || parsedStaminaIv > MAX_IV)
    ) {
      return `Stamina IV must be between ${MIN_IV} and ${MAX_IV}.`;
    }
    return null;
  }, [parsedAttackIv, parsedCp, parsedDefenseIv, parsedLevel, parsedStaminaIv]);

  const battleStatsUnchanged = useMemo(() => {
    if (!selectedInstance) return true;
    if (
      parsedCp === 'invalid' ||
      parsedLevel === 'invalid' ||
      parsedAttackIv === 'invalid' ||
      parsedDefenseIv === 'invalid' ||
      parsedStaminaIv === 'invalid'
    ) {
      return true;
    }
    return (
      selectedInstance.cp === parsedCp &&
      selectedInstance.level === parsedLevel &&
      selectedInstance.attack_iv === parsedAttackIv &&
      selectedInstance.defense_iv === parsedDefenseIv &&
      selectedInstance.stamina_iv === parsedStaminaIv
    );
  }, [
    parsedAttackIv,
    parsedCp,
    parsedDefenseIv,
    parsedLevel,
    parsedStaminaIv,
    selectedInstance,
  ]);

  const movesValidationError = useMemo(() => {
    if (parsedFastMoveId === 'invalid') return 'Fast Move ID must be a whole number.';
    if (typeof parsedFastMoveId === 'number' && parsedFastMoveId < 0) {
      return 'Fast Move ID must be 0 or greater.';
    }

    if (parsedChargedMove1Id === 'invalid') return 'Charged Move 1 ID must be a whole number.';
    if (typeof parsedChargedMove1Id === 'number' && parsedChargedMove1Id < 0) {
      return 'Charged Move 1 ID must be 0 or greater.';
    }

    if (parsedChargedMove2Id === 'invalid') return 'Charged Move 2 ID must be a whole number.';
    if (typeof parsedChargedMove2Id === 'number' && parsedChargedMove2Id < 0) {
      return 'Charged Move 2 ID must be 0 or greater.';
    }

    return null;
  }, [parsedChargedMove1Id, parsedChargedMove2Id, parsedFastMoveId]);

  const movesUnchanged = useMemo(() => {
    if (!selectedInstance) return true;
    if (
      parsedFastMoveId === 'invalid' ||
      parsedChargedMove1Id === 'invalid' ||
      parsedChargedMove2Id === 'invalid'
    ) {
      return true;
    }
    return (
      selectedInstance.fast_move_id === parsedFastMoveId &&
      selectedInstance.charged_move1_id === parsedChargedMove1Id &&
      selectedInstance.charged_move2_id === parsedChargedMove2Id
    );
  }, [
    parsedChargedMove1Id,
    parsedChargedMove2Id,
    parsedFastMoveId,
    selectedInstance,
  ]);

  const normalizedLocationCaughtDraft = useMemo(
    () => locationCaughtDraft.trim(),
    [locationCaughtDraft],
  );
  const normalizedLocationCardDraft = useMemo(
    () => locationCardDraft.trim(),
    [locationCardDraft],
  );

  const auraUnchanged = useMemo(() => {
    if (!selectedInstance) return true;
    return (
      Boolean(selectedInstance.lucky) === isLuckyDraft &&
      Boolean(selectedInstance.shadow) === isShadowDraft &&
      Boolean(selectedInstance.purified) === isPurifiedDraft
    );
  }, [isLuckyDraft, isPurifiedDraft, isShadowDraft, selectedInstance]);

  const locationValidationError = useMemo(() => {
    if (normalizedLocationCaughtDraft.length > MAX_LOCATION_FIELD_LENGTH) {
      return `Location caught must be ${MAX_LOCATION_FIELD_LENGTH} characters or fewer.`;
    }
    if (normalizedLocationCardDraft.length > MAX_LOCATION_FIELD_LENGTH) {
      return `Location card must be ${MAX_LOCATION_FIELD_LENGTH} characters or fewer.`;
    }
    return null;
  }, [normalizedLocationCardDraft, normalizedLocationCaughtDraft]);

  const locationUnchanged = useMemo(() => {
    if (!selectedInstance) return true;
    const currentLocationCaught = (selectedInstance.location_caught ?? '').trim();
    const currentLocationCard = (selectedInstance.location_card ?? '').trim();
    return (
      currentLocationCaught === normalizedLocationCaughtDraft &&
      currentLocationCard === normalizedLocationCardDraft
    );
  }, [normalizedLocationCardDraft, normalizedLocationCaughtDraft, selectedInstance]);

  const maxStatsValidationError = useMemo(() => {
    if (parsedMaxAttack === 'invalid') return 'Max Attack must be a whole number.';
    if (
      typeof parsedMaxAttack === 'number' &&
      (parsedMaxAttack < MIN_MAX_LEVEL || parsedMaxAttack > MAX_MAX_LEVEL)
    ) {
      return `Max Attack must be between ${MIN_MAX_LEVEL} and ${MAX_MAX_LEVEL}.`;
    }
    if (parsedMaxGuard === 'invalid') return 'Max Guard must be a whole number.';
    if (
      typeof parsedMaxGuard === 'number' &&
      (parsedMaxGuard < MIN_MAX_LEVEL || parsedMaxGuard > MAX_MAX_LEVEL)
    ) {
      return `Max Guard must be between ${MIN_MAX_LEVEL} and ${MAX_MAX_LEVEL}.`;
    }
    if (parsedMaxSpirit === 'invalid') return 'Max Spirit must be a whole number.';
    if (
      typeof parsedMaxSpirit === 'number' &&
      (parsedMaxSpirit < MIN_MAX_LEVEL || parsedMaxSpirit > MAX_MAX_LEVEL)
    ) {
      return `Max Spirit must be between ${MIN_MAX_LEVEL} and ${MAX_MAX_LEVEL}.`;
    }
    return null;
  }, [parsedMaxAttack, parsedMaxGuard, parsedMaxSpirit]);

  const maxStatsUnchanged = useMemo(() => {
    if (!selectedInstance) return true;
    if (
      parsedMaxAttack === 'invalid' ||
      parsedMaxGuard === 'invalid' ||
      parsedMaxSpirit === 'invalid'
    ) {
      return true;
    }
    return (
      selectedInstance.max_attack === parsedMaxAttack &&
      selectedInstance.max_guard === parsedMaxGuard &&
      selectedInstance.max_spirit === parsedMaxSpirit
    );
  }, [parsedMaxAttack, parsedMaxGuard, parsedMaxSpirit, selectedInstance]);

  const caughtDetailsValidationError = useMemo(() => {
    if (normalizedGenderDraft && !GENDER_OPTIONS.includes(normalizedGenderDraft as (typeof GENDER_OPTIONS)[number])) {
      return `Gender must be one of: ${GENDER_OPTIONS.join(', ')}.`;
    }
    if (normalizedDateCaughtDraft.length > 0 && !isValidDateCaught(normalizedDateCaughtDraft)) {
      return `Date caught must use ${DATE_CAUGHT_FORMAT} format.`;
    }
    return null;
  }, [normalizedDateCaughtDraft, normalizedGenderDraft]);

  const caughtDetailsUnchanged = useMemo(() => {
    if (!selectedInstance) return true;
    const currentGender = normalizeGender(selectedInstance.gender as string | null | undefined);
    const currentDateCaught = (selectedInstance.date_caught ?? '').trim();
    const nextDateCaught = normalizedDateCaughtDraft;
    return (
      currentGender === normalizedGenderDraft &&
      currentDateCaught === nextDateCaught
    );
  }, [normalizedDateCaughtDraft, normalizedGenderDraft, selectedInstance]);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInstancesMap({});
    setSelectedInstanceId(null);
    setNicknameDraft('');
    setCpDraft('');
    setLevelDraft('');
    setAttackIvDraft('');
    setDefenseIvDraft('');
    setStaminaIvDraft('');
    setFastMoveIdDraft('');
    setChargedMove1IdDraft('');
    setChargedMove2IdDraft('');
    setGenderDraft('');
    setDateCaughtDraft('');
    setIsLuckyDraft(false);
    setIsShadowDraft(false);
    setIsPurifiedDraft(false);
    setLocationCaughtDraft('');
    setLocationCardDraft('');
    setMaxAttackDraft('');
    setMaxGuardDraft('');
    setMaxSpiritDraft('');
    setMegaFormDraft('');
    setFusionFormDraft('');
    setTagBucketDraft('caught');
    setTagDraft('');

    try {
      const normalized = usernameInput.trim();
      if (normalized.length > 0) {
        const outcome = await fetchForeignInstancesByUsername(normalized);
        if (outcome.type !== 'success') {
          setInstancesMap({});
          if (outcome.type === 'notFound') setError('Trainer not found.');
          else if (outcome.type === 'forbidden') setError('Trainer collection is private.');
          else setError('Unable to load trainer collection.');
          return;
        }
        setActiveUsername(outcome.username);
        setInstancesMap(outcome.instances);
        return;
      }

      if (!user?.user_id) {
        setInstancesMap({});
        setError('You must be authenticated to load your collection.');
        return;
      }

      const overview = await fetchUserOverview(user.user_id);
      setActiveUsername(overview.user?.username ?? user.username ?? null);
      setInstancesMap(overview.pokemon_instances ?? {});
    } catch (nextError) {
      setInstancesMap({});
      setError(nextError instanceof Error ? nextError.message : 'Failed to load collection.');
    } finally {
      setLoading(false);
    }
  }, [usernameInput, user?.user_id, user?.username]);

  useEffect(() => {
    if (eventVersion === 0) return;
    if (!latestUpdate) return;
    const hasInstanceDelta =
      Object.keys(latestUpdate.pokemon).length > 0 ||
      Object.keys(latestUpdate.relatedInstances).length > 0;
    if (!hasInstanceDelta) return;
    if (!activeUsername || !isOwnCollection || loading || syncing || eventsSyncing) return;
    const now = Date.now();
    if (now - lastEventRefreshAtRef.current < EVENT_REFRESH_COOLDOWN_MS) return;
    lastEventRefreshAtRef.current = now;
    void loadCollection();
  }, [
    activeUsername,
    eventVersion,
    eventsSyncing,
    isOwnCollection,
    latestUpdate,
    loadCollection,
    loading,
    syncing,
  ]);

  const updateInstanceAndSync = async (
    instanceId: string,
    updater: (current: PokemonInstance) => PokemonInstance,
  ) => {
    if (!isOwnCollection || syncing) return;

    const current = instancesMap[instanceId];
    if (!current) return;

    const baseCurrent = toMutableInstance(instanceId, current);
    const nextInstance = toMutableInstance(instanceId, updater(baseCurrent));

    setError(null);
    setSyncing(true);
    setInstancesMap((prev) => ({
      ...prev,
      [instanceId]: nextInstance,
    }));

    try {
      await sendPokemonUpdate(toReceiverPokemonPayload(nextInstance));
    } catch (nextError) {
      setInstancesMap((prev) => ({
        ...prev,
        [instanceId]: baseCurrent,
      }));
      setError(nextError instanceof Error ? nextError.message : 'Failed to sync instance update.');
    } finally {
      setSyncing(false);
    }
  };

  const applyStatus = async (targetStatus: InstanceStatusMutation) => {
    if (!selectedInstanceId) return;
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceStatus(instance, targetStatus),
    );
  };

  const confirmStatusChange = (targetStatus: InstanceStatusMutation) => {
    if (!selectedInstanceId) return;
    const statusLabel =
      targetStatus === 'missing'
        ? 'Set Missing'
        : `Set ${targetStatus.charAt(0).toUpperCase()}${targetStatus.slice(1)}`;
    Alert.alert(
      `${statusLabel}?`,
      `Apply status change "${statusLabel}" to ${selectedInstanceId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => {
            void applyStatus(targetStatus);
          },
        },
      ],
    );
  };

  const applyFavoriteToggle = async () => {
    if (!selectedInstanceId || !selectedInstance) return;
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceFavorite(instance, !Boolean(selectedInstance.favorite)),
    );
  };

  const applyMostWantedToggle = async () => {
    if (!selectedInstanceId || !selectedInstance) return;
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceMostWanted(instance, !Boolean(selectedInstance.most_wanted)),
    );
  };

  const saveNickname = async () => {
    if (!selectedInstanceId) return;
    if (nicknameTooLong) {
      setError(`Nickname must be ${MAX_NICKNAME_LENGTH} characters or fewer.`);
      return;
    }
    if (nicknameUnchanged) {
      return;
    }
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceNickname(instance, nicknameLength > 0 ? normalizedNicknameDraft : null),
    );
  };

  const saveBattleStats = async () => {
    if (!selectedInstanceId) return;
    if (battleStatsValidationError) {
      setError(battleStatsValidationError);
      return;
    }
    if (battleStatsUnchanged) return;
    if (
      parsedCp === 'invalid' ||
      parsedLevel === 'invalid' ||
      parsedAttackIv === 'invalid' ||
      parsedDefenseIv === 'invalid' ||
      parsedStaminaIv === 'invalid'
    ) {
      return;
    }
    setError(null);
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceBattleStats(instance, {
        cp: parsedCp,
        level: parsedLevel,
        attackIv: parsedAttackIv,
        defenseIv: parsedDefenseIv,
        staminaIv: parsedStaminaIv,
      }),
    );
  };

  const saveCaughtDetails = async () => {
    if (!selectedInstanceId) return;
    if (caughtDetailsValidationError) {
      setError(caughtDetailsValidationError);
      return;
    }
    if (caughtDetailsUnchanged) return;
    setError(null);
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceCaughtDetails(instance, {
        gender: normalizedGenderDraft,
        dateCaught: normalizedDateCaughtDraft.length > 0 ? normalizedDateCaughtDraft : null,
      }),
    );
  };

  const saveMoves = async () => {
    if (!selectedInstanceId) return;
    if (movesValidationError) {
      setError(movesValidationError);
      return;
    }
    if (movesUnchanged) return;
    if (
      parsedFastMoveId === 'invalid' ||
      parsedChargedMove1Id === 'invalid' ||
      parsedChargedMove2Id === 'invalid'
    ) {
      return;
    }
    setError(null);
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceMoves(instance, {
        fastMoveId: parsedFastMoveId,
        chargedMove1Id: parsedChargedMove1Id,
        chargedMove2Id: parsedChargedMove2Id,
      }),
    );
  };

  const saveAura = async () => {
    if (!selectedInstanceId) return;
    if (auraUnchanged) return;
    setError(null);
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceAura(instance, {
        lucky: isLuckyDraft,
        shadow: isShadowDraft,
        purified: isPurifiedDraft,
      }),
    );
  };

  const saveLocationDetails = async () => {
    if (!selectedInstanceId) return;
    if (locationValidationError) {
      setError(locationValidationError);
      return;
    }
    if (locationUnchanged) return;
    setError(null);
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceLocationDetails(instance, {
        locationCaught:
          normalizedLocationCaughtDraft.length > 0 ? normalizedLocationCaughtDraft : null,
        locationCard: normalizedLocationCardDraft.length > 0 ? normalizedLocationCardDraft : null,
      }),
    );
  };

  const saveMaxStats = async () => {
    if (!selectedInstanceId) return;
    if (maxStatsValidationError) {
      setError(maxStatsValidationError);
      return;
    }
    if (maxStatsUnchanged) return;
    if (
      parsedMaxAttack === 'invalid' ||
      parsedMaxGuard === 'invalid' ||
      parsedMaxSpirit === 'invalid'
    ) {
      return;
    }
    setError(null);
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceMaxStats(instance, {
        maxAttack: parsedMaxAttack,
        maxGuard: parsedMaxGuard,
        maxSpirit: parsedMaxSpirit,
      }),
    );
  };

  const applyMegaToggle = async () => {
    if (!selectedInstanceId || !selectedInstance) return;
    const nextEnabled = !Boolean(selectedInstance.is_mega || selectedInstance.mega);
    const normalizedForm = megaFormDraft.trim() || null;
    if (nextEnabled && !normalizedForm) {
      setError('Mega form is required when enabling mega.');
      return;
    }
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceMega(instance, nextEnabled, normalizedForm),
    );
  };

  const applyFusionToggle = async () => {
    if (!selectedInstanceId || !selectedInstance) return;
    const nextEnabled = !Boolean(selectedInstance.is_fused);
    const normalizedForm = fusionFormDraft.trim() || null;
    if (nextEnabled && !normalizedForm) {
      setError('Fusion form is required when enabling fusion.');
      return;
    }
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceFusion(instance, nextEnabled, normalizedForm),
    );
  };

  const addTag = async () => {
    if (!selectedInstanceId) return;
    if (tagLength === 0) {
      setError('Tag cannot be empty.');
      return;
    }
    if (tagTooLong) {
      setError(`Tag must be ${MAX_TAG_LENGTH} characters or fewer.`);
      return;
    }
    if (duplicateTagInBucket) {
      setError(`Tag "${normalizedTagDraft}" already exists in ${tagBucketDraft} bucket.`);
      return;
    }
    setError(null);
    await updateInstanceAndSync(selectedInstanceId, (instance) =>
      mutateInstanceAddTag(instance, tagBucketDraft, normalizedTagDraft),
    );
    setTagDraft('');
  };

  const removeTag = async (tag: string) => {
    if (!selectedInstanceId) return;
    Alert.alert(
      `Remove ${toTagBucketLabel(tagBucketDraft)} tag?`,
      `Remove "${tag}" from ${toTagBucketLabel(tagBucketDraft)} tags?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => {
            void updateInstanceAndSync(selectedInstanceId, (instance) =>
              mutateInstanceRemoveTag(instance, tagBucketDraft, tag),
            );
          },
        },
      ],
    );
  };

  const clearSelectedTagBucket = async () => {
    if (!selectedInstanceId || selectedBucketTags.length === 0) return;
    Alert.alert(
      `Clear ${toTagBucketLabel(tagBucketDraft)} tags?`,
      `Remove all ${toTagBucketLabel(tagBucketDraft)} tags for ${selectedInstanceId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            void updateInstanceAndSync(selectedInstanceId, (instance) =>
              mutateInstanceClearTags(instance, tagBucketDraft),
            );
          },
        },
      ],
    );
  };

  const filtered = useMemo(() => filterInstancesByOwnership(items, ownershipMode), [items, ownershipMode]);
  const visible = filtered.slice(0, MAX_ROWS);
  const summary = useMemo(() => summarize(items), [items]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={commonStyles.title}>Pokemon Collection</Text>
      <Text style={commonStyles.subtitle}>Use blank username to load your own collection</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Foreign username (optional)"
        value={usernameInput}
        onChangeText={setUsernameInput}
        style={commonStyles.input}
      />

      <View style={commonStyles.actions}>
        <Button title={loading ? 'Loading...' : 'Load Collection'} onPress={() => void loadCollection()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {activeUsername ? <Text style={commonStyles.caption}>Active trainer: {activeUsername}</Text> : null}
      {!isOwnCollection && activeUsername ? (
        <Text style={commonStyles.hint}>Read-only mode for foreign trainer collections.</Text>
      ) : null}
      {syncing ? <Text style={commonStyles.caption}>Syncing instance update...</Text> : null}
      {error ? <Text style={commonStyles.error}>{error}</Text> : null}
      {!loading && !error && items.length === 0 ? (
        <Text style={commonStyles.caption}>No instances loaded yet.</Text>
      ) : null}

      {items.length > 0 ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Summary</Text>
          <Text style={commonStyles.caption}>Total: {summary.total}</Text>
          <Text style={commonStyles.caption}>Caught: {summary.caught}</Text>
          <Text style={commonStyles.caption}>Trade: {summary.trade}</Text>
          <Text style={commonStyles.caption}>Wanted: {summary.wanted}</Text>
        </View>
      ) : null}

      {items.length > 0 ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Instances ({ownershipMode})</Text>
          <View style={commonStyles.pillRow}>
            {OWNERSHIP_MODES.map((mode) => {
              const selected = mode === ownershipMode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setOwnershipMode(mode)}
                  style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
                >
                  <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={commonStyles.caption}>
            Showing {visible.length} of {filtered.length} rows.
          </Text>
          {visible.map((item) => {
            const selected = selectedInstanceId === item.instanceId;
            return (
                <Pressable
                  key={item.instanceId}
                  onPress={() => {
                    setSelectedInstanceId(item.instanceId);
                    setEditorSection('status');
                    setNicknameDraft(item.nickname ?? '');
                    const selected = instancesMap[item.instanceId];
                    setCpDraft(String(selected?.cp ?? ''));
                    setLevelDraft(String(selected?.level ?? ''));
                    setAttackIvDraft(String(selected?.attack_iv ?? ''));
                    setDefenseIvDraft(String(selected?.defense_iv ?? ''));
                    setStaminaIvDraft(String(selected?.stamina_iv ?? ''));
                    setFastMoveIdDraft(String(selected?.fast_move_id ?? ''));
                    setChargedMove1IdDraft(String(selected?.charged_move1_id ?? ''));
                    setChargedMove2IdDraft(String(selected?.charged_move2_id ?? ''));
                    setGenderDraft(String(selected?.gender ?? ''));
                    setDateCaughtDraft(String(selected?.date_caught ?? ''));
                    setIsLuckyDraft(Boolean(selected?.lucky));
                    setIsShadowDraft(Boolean(selected?.shadow));
                    setIsPurifiedDraft(Boolean(selected?.purified));
                    setLocationCaughtDraft(String(selected?.location_caught ?? ''));
                    setLocationCardDraft(String(selected?.location_card ?? ''));
                    setMaxAttackDraft(String(selected?.max_attack ?? ''));
                    setMaxGuardDraft(String(selected?.max_guard ?? ''));
                    setMaxSpiritDraft(String(selected?.max_spirit ?? ''));
                    setMegaFormDraft(String(selected?.mega_form ?? ''));
                    setFusionFormDraft(String(selected?.fusion_form ?? ''));
                    setTagBucketDraft('caught');
                    setTagDraft('');
                  }}
                  style={[commonStyles.row, selected ? commonStyles.rowSelected : null]}
                >
                <Text style={commonStyles.rowTitle}>{item.variantId || '(missing variant_id)'}</Text>
                <Text style={commonStyles.rowSub}>instance_id: {item.instanceId}</Text>
                <Text style={commonStyles.rowSub}>nickname: {item.nickname ?? '-'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selectedInstance ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>Selected Instance</Text>
          <Text style={commonStyles.caption}>instance_id: {selectedInstanceId}</Text>
          <Text style={commonStyles.caption}>variant_id: {String(selectedInstance.variant_id ?? '-')}</Text>
          <Text style={commonStyles.caption}>
            status: caught={String(Boolean(selectedInstance.is_caught))}, trade=
            {String(Boolean(selectedInstance.is_for_trade))}, wanted={String(Boolean(selectedInstance.is_wanted))}
          </Text>
          <Text style={commonStyles.caption}>
            favorite={String(Boolean(selectedInstance.favorite))}, most_wanted={String(Boolean(selectedInstance.most_wanted))}
          </Text>
          <Text style={commonStyles.caption}>
            cp={String(selectedInstance.cp ?? '-')}, level={String(selectedInstance.level ?? '-')}
          </Text>
          <Text style={commonStyles.caption}>
            ivs atk={String(selectedInstance.attack_iv ?? '-')}, def={String(selectedInstance.defense_iv ?? '-')}, sta={String(selectedInstance.stamina_iv ?? '-')}
          </Text>
          <Text style={commonStyles.caption}>
            moves fast={String(selectedInstance.fast_move_id ?? '-')}, c1={String(selectedInstance.charged_move1_id ?? '-')}, c2={String(selectedInstance.charged_move2_id ?? '-')}
          </Text>
          <Text style={commonStyles.caption}>
            lucky={String(Boolean(selectedInstance.lucky))}, shadow={String(Boolean(selectedInstance.shadow))}, purified={String(Boolean(selectedInstance.purified))}
          </Text>
          <Text style={commonStyles.caption}>
            gender={String(selectedInstance.gender ?? '-')}, date_caught={String(selectedInstance.date_caught ?? '-')}
          </Text>
          <Text style={commonStyles.caption}>
            location_caught={String(selectedInstance.location_caught ?? '-')}, location_card={String(selectedInstance.location_card ?? '-')}
          </Text>
          <Text style={commonStyles.caption}>
            max_attack={String(selectedInstance.max_attack ?? '-')}, max_guard={String(selectedInstance.max_guard ?? '-')}, max_spirit={String(selectedInstance.max_spirit ?? '-')}
          </Text>
          <Text style={commonStyles.caption}>
            mega={String(Boolean(selectedInstance.mega || selectedInstance.is_mega))} ({String(selectedInstance.mega_form ?? '-')})
          </Text>
          <Text style={commonStyles.caption}>
            fused={String(Boolean(selectedInstance.is_fused))} ({String(selectedInstance.fusion_form ?? '-')})
          </Text>
          <Text style={commonStyles.caption}>
            caught_tags={(selectedInstance.caught_tags ?? []).join(', ') || '-'}
          </Text>
          <Text style={commonStyles.caption}>
            trade_tags={(selectedInstance.trade_tags ?? []).join(', ') || '-'}
          </Text>
          <Text style={commonStyles.caption}>
            wanted_tags={(selectedInstance.wanted_tags ?? []).join(', ') || '-'}
          </Text>
          <Text style={commonStyles.hint}>{selectedStatusHint}</Text>

          <Text style={commonStyles.caption}>Editor section</Text>
          <View style={commonStyles.pillRow}>
            {EDITOR_SECTIONS.map((section) => {
              const selected = section === editorSection;
              return (
                <Pressable
                  key={section}
                  onPress={() => setEditorSection(section)}
                  style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
                >
                  <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                    {section}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isOwnCollection ? (
            <>
              {editorSection === 'status' ? (
                <View style={commonStyles.actions}>
                  <Button title="Set Caught" onPress={() => confirmStatusChange('caught')} disabled={syncing} />
                  <Button title="Set Trade" onPress={() => confirmStatusChange('trade')} disabled={syncing} />
                  <Button title="Set Wanted" onPress={() => confirmStatusChange('wanted')} disabled={syncing} />
                  <Button title="Set Missing" onPress={() => confirmStatusChange('missing')} disabled={syncing} />
                </View>
              ) : null}

              {editorSection === 'attributes' ? (
                <>
                  <Text style={commonStyles.hint}>
                    Nickname length: {nicknameLength}/{MAX_NICKNAME_LENGTH}
                  </Text>
                  {nicknameTooLong ? (
                    <Text style={commonStyles.error}>
                      Nickname must be {MAX_NICKNAME_LENGTH} characters or fewer.
                    </Text>
                  ) : null}
                  <Text style={commonStyles.hint}>
                    Mega/Fusion form is required when enabling those states.
                  </Text>
                  <Text style={commonStyles.hint}>
                    IVs must be whole numbers ({MIN_IV}-{MAX_IV}); level must be between {MIN_LEVEL}-{MAX_LEVEL}.
                  </Text>
                  {battleStatsValidationError ? (
                    <Text style={commonStyles.error}>{battleStatsValidationError}</Text>
                  ) : null}
                  <Text style={commonStyles.hint}>
                    Gender options: {GENDER_OPTIONS.join(', ')}. Date caught format: {DATE_CAUGHT_FORMAT}.
                  </Text>
                  {caughtDetailsValidationError ? (
                    <Text style={commonStyles.error}>{caughtDetailsValidationError}</Text>
                  ) : null}
                  <Text style={commonStyles.hint}>
                    Move IDs must be whole numbers (0+), or blank to clear.
                  </Text>
                  {movesValidationError ? (
                    <Text style={commonStyles.error}>{movesValidationError}</Text>
                  ) : null}
                  <Text style={commonStyles.hint}>
                    Aura status: purified and shadow are mutually exclusive.
                  </Text>
                  {locationValidationError ? (
                    <Text style={commonStyles.error}>{locationValidationError}</Text>
                  ) : null}
                  {maxStatsValidationError ? (
                    <Text style={commonStyles.error}>{maxStatsValidationError}</Text>
                  ) : null}
                  <View style={commonStyles.actions}>
                    <Button
                      title={selectedInstance.favorite ? 'Unset Favorite' : 'Set Favorite'}
                      onPress={() => void applyFavoriteToggle()}
                      disabled={syncing}
                    />
                    <Button
                      title={selectedInstance.most_wanted ? 'Unset Most Wanted' : 'Set Most Wanted'}
                      onPress={() => void applyMostWantedToggle()}
                      disabled={syncing || !selectedInstance.is_wanted}
                    />
                    <Button
                      title={selectedInstance.is_mega || selectedInstance.mega ? 'Disable Mega' : 'Enable Mega'}
                      onPress={() => void applyMegaToggle()}
                      disabled={syncing}
                    />
                    <Button
                      title={selectedInstance.is_fused ? 'Disable Fusion' : 'Enable Fusion'}
                      onPress={() => void applyFusionToggle()}
                      disabled={syncing}
                    />
                  </View>

                  <TextInput
                    placeholder="Nickname"
                    value={nicknameDraft}
                    onChangeText={setNicknameDraft}
                    style={commonStyles.input}
                  />
                  <Button
                    title="Save Nickname"
                    onPress={() => void saveNickname()}
                    disabled={syncing || nicknameTooLong || nicknameUnchanged}
                  />

                  <TextInput
                    keyboardType="numeric"
                    placeholder="CP"
                    value={cpDraft}
                    onChangeText={setCpDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Level"
                    value={levelDraft}
                    onChangeText={setLevelDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Attack IV"
                    value={attackIvDraft}
                    onChangeText={setAttackIvDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Defense IV"
                    value={defenseIvDraft}
                    onChangeText={setDefenseIvDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Stamina IV"
                    value={staminaIvDraft}
                    onChangeText={setStaminaIvDraft}
                    style={commonStyles.input}
                  />
                  <Button
                    title="Save Battle Stats"
                    onPress={() => void saveBattleStats()}
                    disabled={syncing || battleStatsUnchanged || Boolean(battleStatsValidationError)}
                  />

                  <TextInput
                    keyboardType="numeric"
                    placeholder="Fast Move ID"
                    value={fastMoveIdDraft}
                    onChangeText={setFastMoveIdDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Charged Move 1 ID"
                    value={chargedMove1IdDraft}
                    onChangeText={setChargedMove1IdDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Charged Move 2 ID"
                    value={chargedMove2IdDraft}
                    onChangeText={setChargedMove2IdDraft}
                    style={commonStyles.input}
                  />
                  <Button
                    title="Save Moves"
                    onPress={() => void saveMoves()}
                    disabled={syncing || movesUnchanged || Boolean(movesValidationError)}
                  />

                  <Text style={commonStyles.caption}>Aura</Text>
                  <View style={commonStyles.actions}>
                    <Button
                      title={isLuckyDraft ? 'Unset Lucky' : 'Set Lucky'}
                      onPress={() => setIsLuckyDraft((prev) => !prev)}
                      disabled={syncing || isShadowDraft}
                    />
                    <Button
                      title={isShadowDraft ? 'Unset Shadow' : 'Set Shadow'}
                      onPress={() => {
                        setIsShadowDraft((prev) => {
                          const next = !prev;
                          if (next) {
                            setIsPurifiedDraft(false);
                            setIsLuckyDraft(false);
                          }
                          return next;
                        });
                      }}
                      disabled={syncing}
                    />
                    <Button
                      title={isPurifiedDraft ? 'Unset Purified' : 'Set Purified'}
                      onPress={() => {
                        setIsPurifiedDraft((prev) => {
                          const next = !prev;
                          if (next) setIsShadowDraft(false);
                          return next;
                        });
                      }}
                      disabled={syncing}
                    />
                  </View>
                  <Button
                    title="Save Aura"
                    onPress={() => void saveAura()}
                    disabled={syncing || auraUnchanged}
                  />

                  <TextInput
                    placeholder="Location Caught"
                    value={locationCaughtDraft}
                    onChangeText={setLocationCaughtDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    placeholder="Location Card"
                    value={locationCardDraft}
                    onChangeText={setLocationCardDraft}
                    style={commonStyles.input}
                  />
                  <Button
                    title="Save Location Details"
                    onPress={() => void saveLocationDetails()}
                    disabled={syncing || locationUnchanged || Boolean(locationValidationError)}
                  />

                  <TextInput
                    keyboardType="numeric"
                    placeholder="Max Attack"
                    value={maxAttackDraft}
                    onChangeText={setMaxAttackDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Max Guard"
                    value={maxGuardDraft}
                    onChangeText={setMaxGuardDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    keyboardType="numeric"
                    placeholder="Max Spirit"
                    value={maxSpiritDraft}
                    onChangeText={setMaxSpiritDraft}
                    style={commonStyles.input}
                  />
                  <Button
                    title="Save Max Stats"
                    onPress={() => void saveMaxStats()}
                    disabled={syncing || maxStatsUnchanged || Boolean(maxStatsValidationError)}
                  />

                  <Text style={commonStyles.caption}>Gender</Text>
                  <View style={commonStyles.pillRow}>
                    {GENDER_OPTIONS.map((option) => {
                      const selected = normalizedGenderDraft === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setGenderDraft(option)}
                          style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
                        >
                          <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => setGenderDraft('')}
                      style={[commonStyles.pill, normalizedGenderDraft === null ? commonStyles.pillSelected : null]}
                    >
                      <Text
                        style={[
                          commonStyles.pillText,
                          normalizedGenderDraft === null ? commonStyles.pillTextSelected : null,
                        ]}
                      >
                        clear
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    placeholder={`Date Caught (${DATE_CAUGHT_FORMAT})`}
                    value={dateCaughtDraft}
                    onChangeText={setDateCaughtDraft}
                    style={commonStyles.input}
                  />
                  <Button
                    title="Save Caught Details"
                    onPress={() => void saveCaughtDetails()}
                    disabled={syncing || caughtDetailsUnchanged || Boolean(caughtDetailsValidationError)}
                  />

                  <TextInput
                    placeholder="Mega Form"
                    value={megaFormDraft}
                    onChangeText={setMegaFormDraft}
                    style={commonStyles.input}
                  />
                  <TextInput
                    placeholder="Fusion Form"
                    value={fusionFormDraft}
                    onChangeText={setFusionFormDraft}
                    style={commonStyles.input}
                  />
                </>
              ) : null}

              {editorSection === 'tags' ? (
                <>
                  <Text style={commonStyles.caption}>Tag bucket</Text>
                  <View style={commonStyles.pillRow}>
                    {TAG_BUCKETS.map((bucket) => {
                      const selected = bucket === tagBucketDraft;
                      return (
                        <Pressable
                          key={bucket}
                          onPress={() => setTagBucketDraft(bucket)}
                          style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
                        >
                          <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                            {bucket}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    placeholder={`Tag for ${tagBucketDraft} bucket`}
                    value={tagDraft}
                    onChangeText={setTagDraft}
                    style={commonStyles.input}
                  />
                  <Text style={commonStyles.hint}>
                    Tag length: {tagLength}/{MAX_TAG_LENGTH}
                  </Text>
                  {duplicateTagInBucket ? (
                    <Text style={commonStyles.hint}>
                      Tag already exists in {tagBucketDraft} bucket.
                    </Text>
                  ) : null}
                  {tagTooLong ? (
                    <Text style={commonStyles.error}>
                      Tag must be {MAX_TAG_LENGTH} characters or fewer.
                    </Text>
                  ) : null}
                  <View style={commonStyles.actions}>
                    <Button
                      title={`Add ${toTagBucketLabel(tagBucketDraft)} Tag`}
                      onPress={() => void addTag()}
                      disabled={syncing || tagLength === 0 || tagTooLong || duplicateTagInBucket}
                    />
                    <Button
                      title={`Clear ${toTagBucketLabel(tagBucketDraft)} Tags`}
                      onPress={() => void clearSelectedTagBucket()}
                      disabled={syncing || selectedBucketTags.length === 0}
                    />
                  </View>

                  {selectedBucketTags.length === 0 ? (
                    <Text style={commonStyles.hint}>
                      No tags in {tagBucketDraft} bucket.
                    </Text>
                  ) : (
                    <View style={styles.tagRow}>
                      {selectedBucketTags.map((tag) => (
                        <Pressable
                          key={`${tagBucketDraft}-${tag}`}
                          onPress={() => void removeTag(tag)}
                          style={styles.tagPill}
                        >
                          <Text style={styles.tagPillText}>
                            Remove {toTagBucketLabel(tagBucketDraft)} tag: {tag}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagPillText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});
