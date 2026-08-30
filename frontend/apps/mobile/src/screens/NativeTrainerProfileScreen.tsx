import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { NativeBackIcon } from '../components/NativeBackIcon';
import { useEffect, useRef, useState } from 'react';
import type { NativeCollectionRow } from '../features/collection/collectionModel';
import {
  NativePokemonLocationBackdrop,
} from '../features/collection/parity/NativePokemonLocationBackdrop';
import type { NativeTrainerProfileModel } from '../features/social/nativeTrainerProfileModel';
import type { NativeTrainerProfileDraft } from '../features/social/nativeTrainerProfileEditorModel';
import {
  NativeTrainerProfileEditorPanel,
} from '../features/social/NativeTrainerProfileEditorPanel';
import { NativeTrainerShowcasePicker } from '../features/social/NativeTrainerShowcasePicker';
import { NativeConfirmationDialog } from '../components/NativeConfirmationDialog';
import { NativeTrainerWorkspaceNav } from '../components/NativeTrainerWorkspaceNav';
import { NativeUiIcon, type NativeUiIconName } from '../components/NativeUiIcon';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';

export type NativeTrainerProfileAction =
  | 'add'
  | 'accept'
  | 'cancel-request'
  | 'remove-friend'
  | 'block';

type Props = {
  assetBaseUrl: string;
  error?: string | null;
  highlights?: NativeCollectionRow[];
  highlightCandidates?: NativeCollectionRow[];
  isLoading?: boolean;
  isOwner: boolean;
  isRelationshipPending?: boolean;
  isProfileSaving?: boolean;
  model?: NativeTrainerProfileModel | null;
  onBack?: () => void;
  onOpenCollection: (filter?: 'caught' | 'trade' | 'wanted' | 'favorites') => void;
  onOpenFriends?: () => void;
  onRetry?: () => void;
  onRelationshipAction?: (action: NativeTrainerProfileAction) => void;
  feedback?: { tone: 'success' | 'error'; text: string } | null;
  onDismissFeedback?: () => void;
  editorDraft?: NativeTrainerProfileDraft | null;
  onBeginEdit?: () => void;
  onCancelEdit?: () => void;
  onChangeEditorDraft?: (draft: NativeTrainerProfileDraft) => void;
  onSaveProfile?: () => void;
};

const TEAM_COLORS = {
  mystic: { accent: '#5eb1f4', soft: '#18374f' },
  valor: { accent: '#ff6f74', soft: '#4a2429' },
  instinct: { accent: '#f2c94c', soft: '#463d1f' },
  neutral: { accent: '#42d7c6', soft: '#173739' },
} as const;

const LIGHT_TEAM_COLORS = {
  mystic: { accent: '#005bb5', soft: '#18374f' },
  valor: { accent: '#b00020', soft: '#4a2429' },
  instinct: { accent: '#7a5700', soft: '#463d1f' },
  neutral: { accent: '#006a61', soft: '#173739' },
} as const;

const relationshipLabel = (relationship: NativeTrainerProfileModel['relationship']): string | null => ({
  friend: 'Friends',
  incoming: 'Request received',
  outgoing: 'Request sent',
  blocked: 'Blocked',
  none: null,
  self: null,
})[relationship];

const HighlightCard = ({
  assetBaseUrl,
  compact,
  light,
  row,
}: {
  assetBaseUrl: string;
  compact: boolean;
  light: boolean;
  row?: NativeCollectionRow;
}) => (
  <View style={[
    styles.highlight,
    compact && !row && styles.highlightEmptyCompact,
    light && styles.highlightLight,
  ]}>
    {row?.locationBackgroundUri ? <NativePokemonLocationBackdrop uri={row.locationBackgroundUri} /> : null}
    {row?.imageUri ? (
      <Image resizeMode="contain" source={{ uri: row.imageUri }} style={styles.highlightImage} />
    ) : (
      <Text style={[styles.emptyStar, light && styles.mutedLight]}>★</Text>
    )}
    {row?.maxKind ? (
      <Image
        resizeMode="contain"
        source={{ uri: `${assetBaseUrl.replace(/\/$/, '')}/images/${row.maxKind}.png` }}
        style={styles.maxIcon}
      />
    ) : null}
    <Text numberOfLines={2} style={[styles.highlightName, light && styles.textLight]}>
      {row?.name ?? 'Open slot'}
    </Text>
    {row ? (
      <Text style={[styles.highlightDetail, light && styles.mutedLight]}>
        {row.cp ? `CP ${row.cp.toLocaleString('en-US')}` : 'Featured Pokémon'}
      </Text>
    ) : null}
  </View>
);

export const NativeTrainerProfileScreen = ({
  assetBaseUrl,
  error = null,
  highlights = [],
  highlightCandidates = [],
  isLoading = false,
  isOwner,
  isRelationshipPending = false,
  isProfileSaving = false,
  model = null,
  onBack,
  onOpenCollection,
  onOpenFriends,
  onRetry,
  onRelationshipAction,
  feedback = null,
  onDismissFeedback,
  editorDraft = null,
  onBeginEdit,
  onCancelEdit,
  onChangeEditorDraft,
  onSaveProfile,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const compactHeader = useWindowDimensions().width <= 520;
  const scrollRef = useRef<ScrollView>(null);
  const [confirmation, setConfirmation] = useState<'cancel-request' | 'remove-friend' | 'block' | null>(null);
  const [editingHighlightSlot, setEditingHighlightSlot] = useState<number | null>(null);

  const clearTextInputFocus = () => {
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (!feedback) return;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [feedback]);

  if (isLoading) {
    return (
      <View style={[styles.state, light && styles.screenLight]}>
        <ActivityIndicator color="#2f9cff" size="large" />
        <Text style={[styles.stateTitle, light && styles.textLight]}>Loading trainer profile</Text>
        <Text style={[styles.stateCopy, light && styles.mutedLight]}>Preparing the trainer card and showcase…</Text>
      </View>
    );
  }

  if (error || !model) {
    return (
      <View style={[styles.state, light && styles.screenLight]}>
        <Text style={styles.errorIcon}>!</Text>
        <Text style={[styles.stateTitle, light && styles.textLight]}>Trainer profile unavailable</Text>
        <Text style={[styles.stateCopy, light && styles.mutedLight]}>{error ?? 'This trainer could not be loaded.'}</Text>
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const team = (light ? LIGHT_TEAM_COLORS : TEAM_COLORS)[model.team];
  const relationship = relationshipLabel(model.relationship);
  const relationshipAction = model.relationship === 'none'
    ? { action: 'add' as const, label: 'Add friend', tone: 'primary' as const }
    : model.relationship === 'incoming'
      ? { action: 'accept' as const, label: 'Accept request', tone: 'primary' as const }
      : model.relationship === 'outgoing'
        ? { action: 'cancel-request' as const, label: 'Request sent', tone: 'secondary' as const }
        : model.relationship === 'friend'
          ? { action: 'remove-friend' as const, label: 'Friends', tone: 'secondary' as const }
          : null;
  const confirmationCopy = confirmation === 'block'
    ? {
        title: `Block ${model.username}?`,
        body: 'Existing friendship and pending requests will be removed. This trainer will no longer be able to interact with you.',
        confirmLabel: 'Block trainer',
      }
    : confirmation === 'remove-friend'
      ? {
          title: `Remove ${model.username}?`,
          body: 'This trainer will be removed from your friends. You can send a new request later.',
          confirmLabel: 'Remove friend',
        }
      : {
          title: 'Cancel friend request?',
          body: `Your pending request to ${model.username} will be canceled.`,
          confirmLabel: 'Cancel request',
        };
  const requestAction = (action: NativeTrainerProfileAction) => {
    clearTextInputFocus();
    if (action === 'cancel-request' || action === 'remove-friend' || action === 'block') {
      setConfirmation(action);
      return;
    }
    onRelationshipAction?.(action);
  };
  const selectedHighlightIds = editorDraft?.highlightInstanceIds ?? [];
  const highlightById = new Map([
    ...highlights,
    ...highlightCandidates,
  ].map((row) => [row.id, row]));
  const displayedHighlights = editorDraft
    ? Array.from({ length: 6 }, (_, index) => highlightById.get(selectedHighlightIds[index] ?? ''))
    : highlights;
  const updateHighlightIds = (nextIds: string[]) => {
    if (!editorDraft || !onChangeEditorDraft) return;
    onChangeEditorDraft({ ...editorDraft, highlightInstanceIds: nextIds });
  };
  const chooseHighlight = (instanceId: string) => {
    if (editingHighlightSlot === null) return;
    clearTextInputFocus();
    const nextIds = Array.from({ length: 6 }, (_, index) => selectedHighlightIds[index] ?? '');
    nextIds[editingHighlightSlot] = instanceId;
    updateHighlightIds(nextIds);
    setEditingHighlightSlot(null);
  };
  const clearHighlight = () => {
    if (editingHighlightSlot === null) return;
    clearTextInputFocus();
    const nextIds = Array.from({ length: 6 }, (_, index) => selectedHighlightIds[index] ?? '');
    nextIds[editingHighlightSlot] = '';
    updateHighlightIds(nextIds);
    setEditingHighlightSlot(null);
  };
  const moveHighlight = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination > 5) return;
    const nextIds = Array.from({ length: 6 }, (_, slot) => selectedHighlightIds[slot] ?? '');
    [nextIds[index], nextIds[destination]] = [nextIds[destination], nextIds[index]];
    updateHighlightIds(nextIds);
  };
  const profileFacts: { icon: NativeUiIconName; label: string; value: string }[] = [
    { icon: 'calendar', label: 'STARTED', value: model.startedLabel },
    { icon: 'map', label: 'LOCATION', value: model.locationLabel },
    { icon: 'id-card', label: 'TRAINER CODE', value: model.trainerCodeLabel },
  ];
  const statIcons: Record<NativeTrainerProfileModel['stats'][number]['key'], NativeUiIconName> = {
    registered: 'catalog',
    caught: 'pokeball',
    trade: 'trade',
    wanted: 'heart',
    favorites: 'star',
  };

  return (
    <View style={[styles.screenRoot, light && styles.screenLight]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: 24, paddingBottom: 116 }]}
        ref={scrollRef}
        style={styles.screen}
        testID="native-trainer-profile"
      >
      <View style={styles.productHeader}>
        {onBack ? (
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={[styles.backButton, light && styles.backButtonLight]}>
            <NativeBackIcon color={light ? '#172124' : '#f7fbfa'} size={20} />
          </Pressable>
        ) : null}
        <View style={styles.productHeaderCopy}>
          <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>{isOwner ? 'YOUR TRAINER CARD' : 'TRAINER PROFILE'}</Text>
          <Text numberOfLines={1} style={[styles.pageTitle, light && styles.textLight]}>{model.username}</Text>
          {!compactHeader ? (
            <Text style={[styles.pageSubtitle, light && styles.mutedLight]}>
              {isOwner ? 'Your Pokémon GO identity and collection showcase.' : `Meet @${model.username} and explore their shared collection.`}
            </Text>
          ) : null}
        </View>
        <View style={[styles.headerActions, compactHeader && styles.headerActionsCompact]}>
          {isOwner && onBeginEdit ? (
            <Pressable
              accessibilityLabel={editorDraft ? 'Cancel' : 'Edit'}
              accessibilityRole="button"
              disabled={isProfileSaving}
              onPress={() => {
                clearTextInputFocus();
                if (editorDraft) onCancelEdit?.();
                else onBeginEdit();
              }}
              style={[
                styles.headerAction,
                styles.headerActionSecondary,
                light && styles.backButtonLight,
              ]}
            >
              {!editorDraft ? (
                <Image
                  accessibilityElementsHidden
                  resizeMode="contain"
                  source={{ uri: `${assetBaseUrl.replace(/\/$/, '')}/images/edit-icon.png` }}
                  style={[styles.headerActionIcon, { tintColor: light ? '#172124' : '#f7fbfa' }]}
                />
              ) : null}
              <Text style={[styles.headerActionText, light && styles.textLight]}>
                {editorDraft ? 'Cancel' : 'Edit'}
              </Text>
            </Pressable>
          ) : null}
          {!isOwner && relationshipAction && onRelationshipAction ? (
            <Pressable
              accessibilityRole="button"
              disabled={isRelationshipPending}
              onPress={() => requestAction(relationshipAction.action)}
              testID="native-profile-relationship-action"
              style={[
                styles.headerAction,
                relationshipAction.tone === 'primary' ? styles.headerActionPrimary : styles.headerActionSecondary,
                light && relationshipAction.tone === 'secondary' && styles.backButtonLight,
              ]}
            >
              <Text style={relationshipAction.tone === 'primary' ? styles.primaryButtonText : [styles.headerActionText, light && styles.textLight]}>
                {isRelationshipPending ? 'Working…' : relationshipAction.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {onOpenFriends ? (
        <NativeTrainerWorkspaceNav
          active="profile"
          onOpenFriends={onOpenFriends}
          onOpenProfile={() => undefined}
        />
      ) : null}

      {feedback ? (
        <View accessibilityRole="alert" style={[styles.feedback, feedback.tone === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
          <Text style={styles.feedbackText}>{feedback.text}</Text>
          {onDismissFeedback ? (
            <Pressable accessibilityLabel="Dismiss message" accessibilityRole="button" onPress={onDismissFeedback}>
              <Text style={styles.feedbackDismiss}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.card, { borderColor: team.accent }, light && styles.cardLight]}>
        <View style={[styles.identity, { backgroundColor: light ? `${team.accent}18` : team.soft, borderColor: `${team.accent}88` }]}>
          <Text style={[styles.cardLabel, { color: team.accent }]}>TRAINER CARD</Text>
          <View style={styles.identityMain}>
            <View style={styles.portraitWrap}>
              <View style={[styles.portrait, { borderColor: team.accent }]}>
                <Text style={styles.portraitText}>{model.avatarLabel}</Text>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: team.accent }, light && styles.levelBadgeLight]}>
                <Text style={[styles.levelLabel, light && styles.primaryButtonTextLight]}>LEVEL</Text>
                <Text style={[styles.levelValue, light && styles.primaryButtonTextLight]}>{model.trainerLevel ?? '–'}</Text>
              </View>
            </View>
            <View style={styles.identityCopy}>
              <Text numberOfLines={1} style={[styles.pogoName, light && styles.textLight]}>{model.pokemonGoName}</Text>
              <Text numberOfLines={1} style={[styles.username, light && styles.mutedLight]}>@{model.username}</Text>
              <View style={styles.teamBlock}>
                <Text style={[styles.teamName, { color: team.accent }]}>{model.teamLabel.toLocaleUpperCase()}</Text>
                <Text style={[styles.xp, light && styles.textLight]}>{model.totalXpLabel}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.levelTrack, light && styles.levelTrackLight]}>
            <View style={[styles.levelTrackFill, { backgroundColor: team.accent, width: `${Math.min(100, Math.max(0, ((model.trainerLevel ?? 0) / 80) * 100))}%` }]} />
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.cardHeading, light && styles.dividerLight]}>
            <View>
              <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>POKÉMON GO NEXUS</Text>
              <Text style={[styles.sectionTitle, light && styles.textLight]}>Trainer card</Text>
            </View>
            <View style={styles.memberBlock}>
              <Text style={[styles.memberLabel, light && styles.mutedLight]}>MEMBER SINCE</Text>
              <Text style={[styles.memberValue, light && styles.textLight]}>{model.memberSinceLabel}</Text>
            </View>
          </View>

          {editorDraft && onChangeEditorDraft && onCancelEdit && onSaveProfile ? (
            <NativeTrainerProfileEditorPanel
              draft={editorDraft}
              isSaving={isProfileSaving}
              onCancel={() => { clearTextInputFocus(); onCancelEdit(); }}
              onChange={onChangeEditorDraft}
              onSave={() => { clearTextInputFocus(); onSaveProfile(); }}
            />
          ) : null}

          <View accessibilityLabel="Featured Pokémon" style={styles.showcase}>
            {Array.from({ length: 6 }, (_, index) => (
              <View
                key={`highlight-${index + 1}`}
                style={[
                  styles.highlightSlot,
                  compactHeader && styles.highlightSlotCompact,
                  compactHeader && index % 3 !== 2 && styles.gridRightBorder,
                  compactHeader && index < 3 && styles.gridBottomBorder,
                  !compactHeader && index < 5 && styles.gridRightBorder,
                  light && styles.gridBorderLight,
                ]}
              >
                {editorDraft ? (
                  <Pressable
                    accessibilityLabel={`${displayedHighlights[index]?.name ?? 'Open slot'}, edit showcase slot ${index + 1}`}
                    accessibilityRole="button"
                    onPress={() => {
                      clearTextInputFocus();
                      setEditingHighlightSlot(index);
                    }}
                    style={styles.highlightEditButton}
                    testID={`native-profile-showcase-slot-${index + 1}`}
                  >
                    <HighlightCard assetBaseUrl={assetBaseUrl} compact={compactHeader} light={light} row={displayedHighlights[index]} />
                    <Text style={styles.highlightEditCue}>EDIT · SLOT {index + 1}</Text>
                  </Pressable>
                ) : (
                  <HighlightCard assetBaseUrl={assetBaseUrl} compact={compactHeader} light={light} row={displayedHighlights[index]} />
                )}
                {editorDraft && displayedHighlights[index] ? (
                  <View style={styles.highlightOrderActions}>
                    <Pressable
                      accessibilityLabel={`Move showcase slot ${index + 1} left`}
                      accessibilityRole="button"
                      disabled={index === 0}
                      onPress={() => moveHighlight(index, -1)}
                      style={[styles.highlightOrderButton, index === 0 && styles.highlightOrderDisabled]}
                    >
                      <Text style={styles.highlightOrderText}>‹</Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Move showcase slot ${index + 1} right`}
                      accessibilityRole="button"
                      disabled={index === 5}
                      onPress={() => moveHighlight(index, 1)}
                      style={[styles.highlightOrderButton, index === 5 && styles.highlightOrderDisabled]}
                    >
                      <Text style={styles.highlightOrderText}>›</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </View>

          <View style={[styles.facts, compactHeader && styles.factsCompact, light && styles.dividerLight]}>
            {profileFacts.map(({ icon, label, value }, index) => (
              <View
                key={label}
                style={[
                  styles.fact,
                  compactHeader && styles.factCompact,
                  compactHeader && index < profileFacts.length - 1 && styles.gridBottomBorder,
                  !compactHeader && index < profileFacts.length - 1 && styles.gridRightBorder,
                  light && styles.gridBorderLight,
                ]}
              >
                <NativeUiIcon color={team.accent} name={icon} size={18} />
                <View style={styles.factCopy}>
                  <Text style={[styles.factLabel, light && styles.mutedLight]}>{label}</Text>
                  <Text numberOfLines={2} style={[styles.factValue, light && styles.textLight]}>{value}</Text>
                </View>
              </View>
            ))}
          </View>

          <View accessibilityLabel="Collection summary" style={[styles.stats, light && styles.dividerLight]}>
            {model.stats.map((stat, index) => {
              const filter = stat.key === 'registered' ? undefined : stat.key;
              const canOpen = model.canViewCollection && filter !== undefined;
              const compactBottomRow = compactHeader && index >= 3;
              const hasRightDivider = compactHeader
                ? (index < 2 || index === 3)
                : index < model.stats.length - 1;
              return (
                <Pressable
                  accessibilityRole={canOpen ? 'button' : undefined}
                  disabled={!canOpen}
                  key={stat.key}
                  onPress={() => filter && onOpenCollection(filter)}
                  style={[
                    styles.stat,
                    compactHeader ? (compactBottomRow ? styles.statCompactBottom : styles.statCompactTop) : styles.statWide,
                    hasRightDivider && styles.gridRightBorder,
                    compactHeader && index < 3 && styles.gridBottomBorder,
                    light && styles.gridBorderLight,
                    canOpen && styles.statInteractive,
                  ]}
                >
                  <NativeUiIcon color={team.accent} name={statIcons[stat.key]} size={21} />
                  <View style={styles.statCopy}>
                    <Text numberOfLines={1} style={[styles.statLabel, light && styles.mutedLight]}>{stat.label}</Text>
                    <Text style={[styles.statValue, { color: team.accent }]}>{stat.value.toLocaleString('en-US')}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <View style={styles.titlesBlock}>
              <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>PLAY STYLES</Text>
              <View style={styles.titles}>
                {model.titles.length ? model.titles.map((title) => (
                  <View key={title.id} style={[styles.titleBadge, light && styles.titleBadgeLight, { borderColor: `${team.accent}88` }]}>
                    <Text style={{ color: team.accent }}>◆</Text>
                    <Text style={[styles.titleBadgeText, light && styles.textLight]}>{title.label}</Text>
                  </View>
                )) : <Text style={[styles.noTitles, light && styles.mutedLight]}>No play styles selected</Text>}
              </View>
            </View>
            {relationship ? (
              <View style={[styles.relationship, { borderColor: `${team.accent}88` }]}>
                <Text style={[styles.relationshipText, { color: team.accent }]}>{relationship}</Text>
              </View>
            ) : null}
          </View>

          {model.canViewCollection ? (
            <Pressable accessibilityRole="button" onPress={() => onOpenCollection()} style={[styles.primaryButton, { backgroundColor: team.accent }]}>
              <Text style={[styles.primaryButtonText, light && styles.primaryButtonTextLight]}>View Pokémon</Text>
            </Pressable>
          ) : null}
          {!isOwner && model.relationship !== 'blocked' && onRelationshipAction ? (
            <Pressable
              accessibilityLabel="Block trainer"
              accessibilityRole="button"
              disabled={isRelationshipPending}
              onPress={() => requestAction('block')}
              style={styles.blockButton}
              testID="native-profile-block-trainer"
            >
              <Text style={styles.blockButtonText}>Block trainer</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      </ScrollView>
      <NativeConfirmationDialog
        body={confirmationCopy.body}
        confirmLabel={confirmationCopy.confirmLabel}
        isPending={isRelationshipPending}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          if (!confirmation) return;
          onRelationshipAction?.(confirmation);
          setConfirmation(null);
        }}
        title={confirmationCopy.title}
        visible={Boolean(confirmation)}
      />
      <NativeTrainerShowcasePicker
        assetBaseUrl={assetBaseUrl}
        candidates={highlightCandidates}
        onClear={clearHighlight}
        onClose={() => { clearTextInputFocus(); setEditingHighlightSlot(null); }}
        onSelect={chooseHighlight}
        selectedIds={selectedHighlightIds}
        slotIndex={editingHighlightSlot ?? 0}
        visible={editingHighlightSlot !== null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: '#081012' },
  screen: { flex: 1 },
  screenLight: { backgroundColor: '#f8fff9' },
  content: { width: '100%', maxWidth: 1060, alignSelf: 'center', paddingHorizontal: 14, gap: 14 },
  productHeader: { minHeight: 62, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 11 },
  productHeaderCopy: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerActionsCompact: { width: '100%', justifyContent: 'flex-start' },
  headerAction: { minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderRadius: 9 },
  headerActionIcon: { width: 17, height: 17 },
  headerActionPrimary: { backgroundColor: '#36c5a4' },
  headerActionSecondary: { borderWidth: 1, borderColor: '#536467', backgroundColor: '#171c1d' },
  headerActionText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  eyebrow: { color: '#35a8ff', fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 1.3 },
  eyebrowLight: { color: '#005bb5' },
  pageTitle: { color: '#f7fbfa', fontSize: 28, lineHeight: 34, fontWeight: '900' },
  pageSubtitle: { maxWidth: 620, color: '#9db5b4', fontSize: 13, lineHeight: 19 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#315052', borderRadius: 10, backgroundColor: '#171c1d' },
  backButtonLight: { borderColor: '#9bb8b1', backgroundColor: '#f3faf5' },
  card: { overflow: 'hidden', borderWidth: 1, borderRadius: 10, backgroundColor: '#171c1d' },
  cardLight: { backgroundColor: '#f3faf5' },
  identity: { padding: 14, borderBottomWidth: 1 },
  cardLabel: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  identityMain: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 10 },
  identityCopy: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  portraitWrap: { width: 80, height: 80, flexShrink: 0 },
  portrait: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 38, backgroundColor: '#173436' },
  portraitText: { color: '#ffffff', fontSize: 38, fontWeight: '900' },
  levelBadge: { position: 'absolute', right: 0, bottom: 0, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#171c1d', borderRadius: 21 },
  levelBadgeLight: { borderColor: '#f3faf5' },
  levelLabel: { color: '#071516', fontSize: 8, lineHeight: 10, fontWeight: '900' },
  levelValue: { color: '#071516', fontSize: 16, lineHeight: 18, fontWeight: '900' },
  pogoName: { maxWidth: '100%', color: '#f7fbfa', fontSize: 21, lineHeight: 25, fontWeight: '900' },
  username: { color: '#9db5b4', fontSize: 13 },
  teamBlock: { alignItems: 'flex-start', gap: 2, marginTop: 6 },
  teamName: { fontSize: 13, fontWeight: '900' },
  xp: { color: '#f7fbfa', fontSize: 13, fontWeight: '800' },
  levelTrack: { width: '100%', height: 6, overflow: 'hidden', marginTop: 9, borderRadius: 3, backgroundColor: '#52626366' },
  levelTrackLight: { backgroundColor: '#aebbbc66' },
  levelTrackFill: { height: '100%', borderRadius: 3 },
  cardBody: { padding: 16 },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#315052' },
  sectionTitle: { color: '#f7fbfa', fontSize: 22, fontWeight: '900' },
  memberBlock: { maxWidth: '45%', alignItems: 'flex-end' },
  memberLabel: { color: '#9db5b4', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  memberValue: { color: '#f7fbfa', fontSize: 12, fontWeight: '800', textAlign: 'right' },
  showcase: { minHeight: 112, flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1, borderColor: '#315052' },
  highlightSlot: { width: '16.6667%' },
  highlightSlotCompact: { width: '33.3333%' },
  gridRightBorder: { borderRightWidth: 1, borderRightColor: '#315052' },
  gridBottomBorder: { borderBottomWidth: 1, borderBottomColor: '#315052' },
  gridBorderLight: { borderColor: '#9bb8b1' },
  highlightEditButton: { width: '100%' },
  highlight: { position: 'relative', width: '100%', minHeight: 112, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, paddingVertical: 9 },
  highlightEmptyCompact: { minHeight: 54, paddingVertical: 2 },
  highlightLight: {},
  highlightImage: { width: '100%', maxWidth: 74, height: 64, marginBottom: 2 },
  maxIcon: { position: 'absolute', top: 7, right: 7, width: 22, height: 22 },
  emptyStar: { marginBottom: 1, color: '#669ab4', fontSize: 22, lineHeight: 24 },
  highlightName: { color: '#f7fbfa', fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'center' },
  highlightDetail: { color: '#9db5b4', fontSize: 9, lineHeight: 12, textAlign: 'center' },
  highlightEditCue: { position: 'absolute', top: 5, left: 5, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, backgroundColor: '#1780c9', color: '#ffffff', fontSize: 7, fontWeight: '900' },
  highlightOrderActions: { flexDirection: 'row', gap: 4 },
  highlightOrderButton: { minHeight: 34, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#456265', borderRadius: 6, backgroundColor: '#172526' },
  highlightOrderDisabled: { opacity: 0.3 },
  highlightOrderText: { color: '#ffffff', fontSize: 24, lineHeight: 24, fontWeight: '900' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1, borderColor: '#315052' },
  factsCompact: { flexDirection: 'column' },
  fact: { width: '33.3333%', minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 13 },
  factCompact: { width: '100%', minHeight: 58, paddingVertical: 8 },
  factCopy: { flex: 1, minWidth: 0, gap: 2 },
  factLabel: { color: '#9db5b4', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  factValue: { color: '#f7fbfa', fontSize: 12, lineHeight: 16, fontWeight: '800' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', borderBottomWidth: 1, borderColor: '#315052' },
  stat: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6, paddingVertical: 10 },
  statWide: { width: '20%' },
  statCompactTop: { width: '33.3333%' },
  statCompactBottom: { width: '50%' },
  statInteractive: { backgroundColor: '#2f9cff0a' },
  statCopy: { minWidth: 0, gap: 2 },
  statLabel: {
    color: '#9db5b4',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  statValue: { fontSize: 19, lineHeight: 21, fontWeight: '900' },
  footer: { gap: 10, paddingTop: 13 },
  titlesBlock: { gap: 7 },
  titles: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  titleBadge: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 18, backgroundColor: '#11191a' },
  titleBadgeLight: { backgroundColor: '#e3efe8' },
  titleBadgeText: { color: '#f7fbfa', fontSize: 11, fontWeight: '800' },
  noTitles: { color: '#9db5b4', fontSize: 12 },
  relationship: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 16 },
  relationshipText: { fontSize: 11, fontWeight: '900' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#2f9cff' },
  primaryButtonText: { color: '#061617', fontSize: 14, fontWeight: '900' },
  primaryButtonTextLight: { color: '#ffffff' },
  blockButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: '#a9434d', borderRadius: 8, backgroundColor: '#6c252d' },
  blockButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderWidth: 1, borderRadius: 10 },
  feedbackSuccess: { borderColor: '#2fbd79', backgroundColor: '#13372b' },
  feedbackError: { borderColor: '#ef5b72', backgroundColor: '#3a1820' },
  feedbackText: { flex: 1, color: '#ffffff', fontSize: 13, lineHeight: 18, fontWeight: '800' },
  feedbackDismiss: { color: '#ffffff', fontSize: 24, lineHeight: 25 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 28, backgroundColor: '#081012' },
  stateTitle: { color: '#f7fbfa', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  stateCopy: { maxWidth: 420, color: '#9db5b4', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  errorIcon: { color: '#ff7082', fontSize: 30, fontWeight: '900' },
  dividerLight: { borderColor: '#9bb8b1' },
  textLight: { color: '#2f4744' },
  mutedLight: { color: '#4b625e' },
});
