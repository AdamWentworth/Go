import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeCollectionRow } from '../features/collection/collectionModel';
import { NativePokemonLocationBackdrop } from '../features/collection/parity/NativePokemonLocationBackdrop';
import type { NativeTrainerProfileModel } from '../features/social/nativeTrainerProfileModel';
import { NativeConfirmationDialog } from '../components/NativeConfirmationDialog';

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
  isLoading?: boolean;
  isOwner: boolean;
  isRelationshipPending?: boolean;
  model?: NativeTrainerProfileModel | null;
  onBack?: () => void;
  onOpenCollection: (filter?: 'caught' | 'trade' | 'wanted' | 'favorites') => void;
  onRetry?: () => void;
  onRelationshipAction?: (action: NativeTrainerProfileAction) => void;
  feedback?: { tone: 'success' | 'error'; text: string } | null;
  onDismissFeedback?: () => void;
};

const TEAM_COLORS = {
  mystic: { accent: '#5eb1f4', soft: '#18374f' },
  valor: { accent: '#ff6f74', soft: '#4a2429' },
  instinct: { accent: '#f2c94c', soft: '#463d1f' },
  neutral: { accent: '#42d7c6', soft: '#173739' },
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
  light,
  row,
}: {
  assetBaseUrl: string;
  light: boolean;
  row?: NativeCollectionRow;
}) => (
  <View style={[styles.highlight, light && styles.highlightLight]}>
    {row?.locationBackgroundUri ? <NativePokemonLocationBackdrop uri={row.locationBackgroundUri} /> : null}
    {row?.imageUri ? (
      <Image resizeMode="contain" source={{ uri: row.imageUri }} style={styles.highlightImage} />
    ) : (
      <Text style={[styles.emptyStar, light && styles.mutedLight]}>☆</Text>
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
    <Text style={[styles.highlightDetail, light && styles.mutedLight]}>
      {row ? (row.cp ? `CP ${row.cp.toLocaleString('en-US')}` : 'Featured Pokémon') : 'Featured Pokémon'}
    </Text>
  </View>
);

export const NativeTrainerProfileScreen = ({
  assetBaseUrl,
  error = null,
  highlights = [],
  isLoading = false,
  isOwner,
  isRelationshipPending = false,
  model = null,
  onBack,
  onOpenCollection,
  onRetry,
  onRelationshipAction,
  feedback = null,
  onDismissFeedback,
}: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const [confirmation, setConfirmation] = useState<'cancel-request' | 'remove-friend' | 'block' | null>(null);

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

  const team = TEAM_COLORS[model.team];
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
    if (action === 'cancel-request' || action === 'remove-friend' || action === 'block') {
      setConfirmation(action);
      return;
    }
    onRelationshipAction?.(action);
  };

  return (
    <View style={[styles.screenRoot, light && styles.screenLight]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 24), paddingBottom: Math.max(insets.bottom + 100, 116) }]}
        style={styles.screen}
        testID="native-trainer-profile"
      >
      <View style={styles.productHeader}>
        <View style={styles.productHeaderCopy}>
          <Text style={styles.eyebrow}>{isOwner ? 'YOUR TRAINER CARD' : 'TRAINER PROFILE'}</Text>
          <Text numberOfLines={1} style={[styles.pageTitle, light && styles.textLight]}>{model.username}</Text>
          <Text style={[styles.pageSubtitle, light && styles.mutedLight]}>
            {isOwner ? 'Your Pokémon GO identity and collection showcase.' : `Meet @${model.username} and explore their shared collection.`}
          </Text>
        </View>
        <View style={styles.headerActions}>
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
          {onBack ? (
            <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={[styles.backButton, light && styles.backButtonLight]}>
              <Text style={[styles.backButtonText, light && styles.textLight]}>‹</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

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
          <View style={styles.portraitWrap}>
            <View style={[styles.portrait, { borderColor: team.accent }]}>
              <Text style={styles.portraitText}>{model.avatarLabel}</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: team.accent }, light && styles.levelBadgeLight]}>
              <Text style={styles.levelLabel}>LEVEL</Text>
              <Text style={styles.levelValue}>{model.trainerLevel ?? '–'}</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={[styles.pogoName, light && styles.textLight]}>{model.pokemonGoName}</Text>
          <Text numberOfLines={1} style={[styles.username, light && styles.mutedLight]}>@{model.username}</Text>
          <View style={styles.teamBlock}>
            <Text style={[styles.teamName, { color: team.accent }]}>{model.teamLabel.toLocaleUpperCase()}</Text>
            <Text style={[styles.xp, light && styles.textLight]}>{model.totalXpLabel}</Text>
            <View style={[styles.levelTrack, light && styles.levelTrackLight]}>
              <View style={[styles.levelTrackFill, { backgroundColor: team.accent, width: `${Math.min(100, Math.max(0, ((model.trainerLevel ?? 0) / 80) * 100))}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={[styles.cardHeading, light && styles.dividerLight]}>
            <View>
              <Text style={styles.eyebrow}>POKÉMON GO NEXUS</Text>
              <Text style={[styles.sectionTitle, light && styles.textLight]}>Trainer card</Text>
            </View>
            <View style={styles.memberBlock}>
              <Text style={[styles.memberLabel, light && styles.mutedLight]}>MEMBER SINCE</Text>
              <Text style={[styles.memberValue, light && styles.textLight]}>{model.memberSinceLabel}</Text>
            </View>
          </View>

          <View accessibilityLabel="Featured Pokémon" style={styles.showcase}>
            {Array.from({ length: 6 }, (_, index) => (
              <HighlightCard assetBaseUrl={assetBaseUrl} key={`highlight-${index + 1}`} light={light} row={highlights[index]} />
            ))}
          </View>

          <View style={[styles.facts, light && styles.dividerLight]}>
            {[
              ['STARTED', model.startedLabel],
              ['LOCATION', model.locationLabel],
              ['TRAINER CODE', model.trainerCodeLabel],
            ].map(([label, value]) => (
              <View key={label} style={styles.fact}>
                <Text style={[styles.factLabel, { color: team.accent }]}>{label}</Text>
                <Text numberOfLines={2} style={[styles.factValue, light && styles.textLight]}>{value}</Text>
              </View>
            ))}
          </View>

          <View accessibilityLabel="Collection summary" style={styles.stats}>
            {model.stats.map((stat) => {
              const filter = stat.key === 'registered' ? undefined : stat.key;
              const canOpen = model.canViewCollection && filter !== undefined;
              return (
                <Pressable
                  accessibilityRole={canOpen ? 'button' : undefined}
                  disabled={!canOpen}
                  key={stat.key}
                  onPress={() => filter && onOpenCollection(filter)}
                  style={[styles.stat, light && styles.statLight, canOpen && { borderColor: `${team.accent}88` }]}
                >
                  <Text style={[styles.statLabel, light && styles.mutedLight]}>{stat.label}</Text>
                  <Text style={[styles.statValue, { color: team.accent }]}>{stat.value.toLocaleString('en-US')}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <View style={styles.titlesBlock}>
              <Text style={styles.eyebrow}>PLAY STYLES</Text>
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
              <Text style={styles.primaryButtonText}>View Pokémon</Text>
            </Pressable>
          ) : null}
          {!isOwner && model.relationship !== 'blocked' && onRelationshipAction ? (
            <Pressable
              accessibilityRole="button"
              disabled={isRelationshipPending}
              onPress={() => requestAction('block')}
              style={styles.blockButton}
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
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: '#081012' },
  screen: { flex: 1 },
  screenLight: { backgroundColor: '#eef4f5' },
  content: { width: '100%', maxWidth: 1060, alignSelf: 'center', paddingHorizontal: 14, gap: 14 },
  productHeader: { minHeight: 74, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  productHeaderCopy: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderRadius: 9 },
  headerActionPrimary: { backgroundColor: '#36c5a4' },
  headerActionSecondary: { borderWidth: 1, borderColor: '#536467', backgroundColor: '#171c1d' },
  headerActionText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  eyebrow: { color: '#35a8ff', fontSize: 11, lineHeight: 15, fontWeight: '900', letterSpacing: 1.3 },
  pageTitle: { color: '#f7fbfa', fontSize: 28, lineHeight: 34, fontWeight: '900' },
  pageSubtitle: { maxWidth: 620, color: '#9db5b4', fontSize: 13, lineHeight: 19 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#315052', borderRadius: 10, backgroundColor: '#171c1d' },
  backButtonLight: { borderColor: '#acbabc', backgroundColor: '#ffffff' },
  backButtonText: { color: '#f7fbfa', fontSize: 34, lineHeight: 36 },
  card: { overflow: 'hidden', borderWidth: 1, borderRadius: 10, backgroundColor: '#171c1d' },
  cardLight: { backgroundColor: '#ffffff' },
  identity: { alignItems: 'center', padding: 18, borderBottomWidth: 1 },
  cardLabel: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  portraitWrap: { width: 144, height: 144, marginTop: 10, marginBottom: 10 },
  portrait: { width: 136, height: 136, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderRadius: 68, backgroundColor: '#173436' },
  portraitText: { color: '#ffffff', fontSize: 64, fontWeight: '900' },
  levelBadge: { position: 'absolute', right: 0, bottom: 0, width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#171c1d', borderRadius: 29 },
  levelBadgeLight: { borderColor: '#ffffff' },
  levelLabel: { color: '#071516', fontSize: 8, lineHeight: 10, fontWeight: '900' },
  levelValue: { color: '#071516', fontSize: 20, lineHeight: 22, fontWeight: '900' },
  pogoName: { maxWidth: '100%', color: '#f7fbfa', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  username: { color: '#9db5b4', fontSize: 13 },
  teamBlock: { width: '100%', alignItems: 'center', gap: 3, marginTop: 18 },
  teamName: { fontSize: 13, fontWeight: '900' },
  xp: { color: '#f7fbfa', fontSize: 13, fontWeight: '800' },
  levelTrack: { width: '100%', height: 6, overflow: 'hidden', marginTop: 5, borderRadius: 3, backgroundColor: '#52626366' },
  levelTrackLight: { backgroundColor: '#aebbbc66' },
  levelTrackFill: { height: '100%', borderRadius: 3 },
  cardBody: { gap: 14, padding: 16 },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#315052' },
  sectionTitle: { color: '#f7fbfa', fontSize: 22, fontWeight: '900' },
  memberBlock: { maxWidth: '45%', alignItems: 'flex-end' },
  memberLabel: { color: '#9db5b4', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  memberValue: { color: '#f7fbfa', fontSize: 12, fontWeight: '800', textAlign: 'right' },
  showcase: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  highlight: { position: 'relative', width: '31.5%', minHeight: 128, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', padding: 7, borderWidth: 1, borderColor: '#315052', borderRadius: 8, backgroundColor: '#11191a' },
  highlightLight: { borderColor: '#bdc8ca', backgroundColor: '#f6f9f9' },
  highlightImage: { width: 74, height: 74, marginBottom: 2 },
  maxIcon: { position: 'absolute', top: 7, right: 7, width: 22, height: 22 },
  emptyStar: { marginBottom: 25, color: '#6f7c7e', fontSize: 34 },
  highlightName: { color: '#f7fbfa', fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'center' },
  highlightDetail: { color: '#9db5b4', fontSize: 9, lineHeight: 12, textAlign: 'center' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 13, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#315052' },
  fact: { flexGrow: 1, flexBasis: 96, gap: 2 },
  factLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  factValue: { color: '#f7fbfa', fontSize: 12, lineHeight: 16, fontWeight: '800' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  stat: { flexGrow: 1, flexBasis: 88, minHeight: 62, justifyContent: 'center', padding: 9, borderWidth: 1, borderColor: '#315052', borderRadius: 8, backgroundColor: '#11191a' },
  statLight: { borderColor: '#bdc8ca', backgroundColor: '#f6f9f9' },
  statLabel: { color: '#9db5b4', fontSize: 10, fontWeight: '800' },
  statValue: { fontSize: 20, fontWeight: '900' },
  footer: { gap: 10 },
  titlesBlock: { gap: 7 },
  titles: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  titleBadge: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 18, backgroundColor: '#11191a' },
  titleBadgeLight: { backgroundColor: '#f6f9f9' },
  titleBadgeText: { color: '#f7fbfa', fontSize: 11, fontWeight: '800' },
  noTitles: { color: '#9db5b4', fontSize: 12 },
  relationship: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 16 },
  relationshipText: { fontSize: 11, fontWeight: '900' },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#2f9cff' },
  primaryButtonText: { color: '#061617', fontSize: 14, fontWeight: '900' },
  blockButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#a9434d', borderRadius: 8, backgroundColor: '#6c252d' },
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
  dividerLight: { borderColor: '#bdc8ca' },
  textLight: { color: '#172124' },
  mutedLight: { color: '#5e6c6f' },
});
