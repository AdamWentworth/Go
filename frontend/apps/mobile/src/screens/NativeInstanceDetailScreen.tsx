import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeInstanceDetail } from '../features/collection/collectionModel';
import { theme } from '../ui/theme';

type NativeInstanceDetailScreenProps = {
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

const statusLabels = {
  caught: 'Caught',
  trade: 'For trade',
  wanted: 'Wanted',
} as const;

const statusColors = {
  caught: '#79c2ff',
  trade: '#61e5a3',
  wanted: '#ff8b9d',
} as const;

const DetailRows = ({
  rows,
}: {
  rows: { label: string; value: string }[];
}) => (
  <View style={styles.detailRows}>
    {rows.map((row) => (
      <View key={row.label} style={styles.detailRow}>
        <Text style={styles.detailLabel}>{row.label}</Text>
        <Text style={styles.detailValue}>{row.value}</Text>
      </View>
    ))}
  </View>
);

export const NativeInstanceDetailScreen = ({
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
}: NativeInstanceDetailScreenProps) => {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#5ed8ff" size="large" />
        <Text style={styles.loadingText}>Loading Pokémon details…</Text>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="header" style={styles.errorTitle}>Pokémon unavailable</Text>
        <Text style={styles.errorBody}>{error ?? 'This instance was not found.'}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to collection</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = statusColors[detail.row.status];
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Pokémon details</Text>
        <View style={styles.topBarSpacer} />
      </View>

      {cachedAt != null ? (
        <View accessibilityLiveRegion="polite" style={styles.cachedCard}>
          <Text style={styles.cachedTitle}>Viewing an offline copy</Text>
          <Text style={styles.cachedBody}>Retained changes are shown and will sync after reconnecting.</Text>
        </View>
      ) : null}

      <View style={styles.hero}>
        <Text style={styles.dexNumber}>
          #{String(detail.row.pokedexNumber).padStart(4, '0')}
        </Text>
        <View style={styles.imageFrame}>
          {detail.row.imageUri ? (
            <Image
              accessibilityLabel={detail.row.name}
              resizeMode="contain"
              source={{ uri: detail.row.imageUri }}
              style={styles.image}
            />
          ) : (
            <Text style={styles.imageFallback}>#{detail.row.pokemonId}</Text>
          )}
        </View>
        <Text accessibilityRole="header" style={styles.name}>{detail.row.name}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabels[detail.row.status]}
          </Text>
        </View>
        {detail.traits.length ? (
          <View style={styles.traits}>
            {detail.traits.map((trait) => (
              <View key={trait} style={styles.traitBadge}>
                <Text style={styles.traitText}>{trait}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {detail.stats.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pokémon information</Text>
          <DetailRows rows={detail.stats} />
        </View>
      ) : null}

      {detail.ivs.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appraisal</Text>
          <View style={styles.ivRows}>
            {detail.ivs.map((iv) => (
              <View key={iv.label} style={styles.ivRow}>
                <View style={styles.ivHeader}>
                  <Text style={styles.detailLabel}>{iv.label}</Text>
                  <Text style={styles.detailValue}>{iv.value}/15</Text>
                </View>
                <View style={styles.ivTrack}>
                  <View style={[styles.ivFill, { width: `${Math.max(0, Math.min(15, iv.value)) / 15 * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {detail.moves.length || movesWarning ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Moves</Text>
          {detail.moves.length ? <DetailRows rows={detail.moves} /> : null}
          {movesWarning ? <Text style={styles.warningText}>{movesWarning}</Text> : null}
        </View>
      ) : null}

      {detail.preferences.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trade preferences</Text>
          <DetailRows rows={detail.preferences} />
        </View>
      ) : null}

      {detail.provenance.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <DetailRows rows={detail.provenance} />
        </View>
      ) : null}

      {detail.row.status === 'caught' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collection actions</Text>
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => onToggleFavorite(!detail.row.favorite)}
            style={({ pressed }) => [
              styles.favoriteButton,
              detail.row.favorite && styles.favoriteButtonSelected,
              (pressed || isSaving) && styles.buttonPressed,
            ]}
          >
            <Text style={styles.favoriteIcon}>{detail.row.favorite ? '★' : '☆'}</Text>
            <Text style={styles.favoriteButtonText}>
              {isSaving
                ? 'Saving on this device…'
                : detail.row.favorite
                  ? 'Remove Favorite'
                  : 'Mark as Favorite'}
            </Text>
          </Pressable>
          <Text style={styles.actionHint}>
            Native Favorite changes are retained offline and synchronized through Receiver.
          </Text>
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

      <Pressable
        accessibilityRole="button"
        onPress={onEditInCurrentApp}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Edit in current app</Text>
      </Pressable>
      <Text style={styles.footerText}>
        Native editing will replace this fallback only after Receiver synchronization is complete.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06162f' },
  content: { gap: theme.spacing.md, padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: '#06162f',
  },
  loadingText: { color: '#cbd5e1' },
  topBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#385773',
    borderRadius: theme.radius.md,
    backgroundColor: '#0c203a',
  },
  backButtonText: { color: '#fff', fontSize: 36, lineHeight: 38 },
  topBarTitle: { flex: 1, color: '#dcecff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  topBarSpacer: { width: 48 },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#294962',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    backgroundColor: '#0b1c2d',
  },
  dexNumber: { alignSelf: 'flex-start', color: '#8ca3b8', fontWeight: '700' },
  imageFrame: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  imageFallback: { color: '#8193a7', fontSize: 24, fontWeight: '800' },
  name: { color: '#fff', fontSize: 27, fontWeight: '900', textAlign: 'center' },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: theme.spacing.md, paddingVertical: 5 },
  statusText: { fontWeight: '800' },
  traits: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.xs },
  traitBadge: { borderRadius: 999, paddingHorizontal: theme.spacing.sm, paddingVertical: 5, backgroundColor: '#23394c' },
  traitText: { color: '#dcecff', fontSize: theme.type.caption, fontWeight: '700' },
  section: {
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#294962',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: '#0c203a',
  },
  sectionTitle: { color: '#5ed8ff', fontSize: theme.type.body, fontWeight: '900' },
  detailRows: { gap: theme.spacing.xs },
  detailRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  detailLabel: { flex: 1, color: '#9fb3c8' },
  detailValue: { flexShrink: 1, color: '#fff', fontWeight: '800', textAlign: 'right' },
  ivRows: { gap: theme.spacing.sm },
  ivRow: { gap: theme.spacing.xs },
  ivHeader: { flexDirection: 'row', alignItems: 'center' },
  ivTrack: { height: 8, overflow: 'hidden', borderRadius: 4, backgroundColor: '#243648' },
  ivFill: { height: '100%', borderRadius: 4, backgroundColor: '#ff9b2f' },
  warningText: { color: '#ffd18a', lineHeight: 19 },
  cachedCard: {
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#a87524',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: '#332714',
  },
  cachedTitle: { color: '#ffe2a8', fontWeight: '900' },
  cachedBody: { color: '#f7d99b', fontSize: theme.type.caption, lineHeight: 18 },
  favoriteButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#6d7d8e',
    borderRadius: theme.radius.md,
    backgroundColor: '#142a3d',
  },
  favoriteButtonSelected: { borderColor: '#ffd75f', backgroundColor: '#413616' },
  favoriteIcon: { color: '#ffd75f', fontSize: 24 },
  favoriteButtonText: { color: '#fff', fontWeight: '900' },
  buttonPressed: { opacity: 0.68 },
  actionHint: { color: '#8ca3b8', fontSize: theme.type.caption, lineHeight: 18 },
  notice: {
    borderWidth: 1,
    borderColor: '#338b6b',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: '#102e26',
  },
  noticeText: { color: '#9ff0ca', lineHeight: 20, fontWeight: '700' },
  saveError: {
    borderWidth: 1,
    borderColor: '#b65b70',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: '#3b1722',
  },
  saveErrorText: { color: '#ffd1da', lineHeight: 20, fontWeight: '700' },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.selectedBorder,
  },
  primaryButtonText: { color: '#fff', fontWeight: '900' },
  secondaryButton: {
    minHeight: 48,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#64748b',
    borderRadius: theme.radius.md,
  },
  secondaryButtonText: { color: '#e2e8f0', fontWeight: '700' },
  errorTitle: { color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  errorBody: { color: '#fecdd3', textAlign: 'center' },
  footerText: { color: '#8ca3b8', fontSize: theme.type.caption, lineHeight: 18, textAlign: 'center' },
});
