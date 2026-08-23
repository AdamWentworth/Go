import type { CollectionSummary } from '@pokemongonexus/shared-contracts/users';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../ui/theme';

type NativeHomeScreenProps = {
  username: string;
  summary: CollectionSummary | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenCurrentApp: () => void;
  onSignOut: () => void;
};

const summaryCards: {
  key: keyof CollectionSummary;
  label: string;
  tone: 'blue' | 'green' | 'red' | 'gold';
}[] = [
  { key: 'collection_total', label: 'Collection', tone: 'blue' },
  { key: 'favorite', label: 'Favorites', tone: 'gold' },
  { key: 'for_trade', label: 'For trade', tone: 'green' },
  { key: 'wanted', label: 'Wanted', tone: 'red' },
];

const toneStyles = {
  blue: { borderColor: '#2385e8', color: '#79c2ff' },
  green: { borderColor: '#2fbd79', color: '#61e5a3' },
  red: { borderColor: '#ef5b72', color: '#ff8b9d' },
  gold: { borderColor: '#d8a921', color: '#ffd75f' },
} as const;

export const NativeHomeScreen = ({
  username,
  summary,
  isLoading,
  error,
  onRetry,
  onOpenCurrentApp,
  onSignOut,
}: NativeHomeScreenProps) => (
  <ScrollView
    contentContainerStyle={styles.content}
    style={styles.screen}
    testID="native-home-screen"
  >
    <View style={styles.header}>
      <Text style={styles.eyebrow}>NATIVE PREVIEW</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Welcome, {username}
      </Text>
      <Text style={styles.body}>
        Your collection overview is now loaded through the native authenticated API.
      </Text>
    </View>

    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionEyebrow}>YOUR POKÉMON</Text>
          <Text style={styles.sectionTitle}>Collection at a glance</Text>
        </View>
        {isLoading ? <ActivityIndicator color="#5ed8ff" /> : null}
      </View>

      {error ? (
        <View accessibilityRole="alert" style={styles.errorCard}>
          <Text style={styles.errorTitle}>Collection unavailable</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {summary ? (
        <View style={styles.summaryGrid}>
          {summaryCards.map((card) => {
            const tone = toneStyles[card.tone];
            return (
              <View key={card.key} style={[styles.summaryCard, { borderColor: tone.borderColor }]}>
                <Text style={[styles.summaryValue, { color: tone.color }]}>
                  {summary[card.key].toLocaleString()}
                </Text>
                <Text style={styles.summaryLabel}>{card.label}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onOpenCurrentApp}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>Open full collection</Text>
      </Pressable>
      <Text style={styles.helperText}>
        Editing remains in the current app until native collection mutations are complete.
      </Text>
    </View>

    <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.signOutButton}>
      <Text style={styles.signOutButtonText}>Sign out of native preview</Text>
    </Pressable>
  </ScrollView>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06162f' },
  content: {
    flexGrow: 1,
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  header: { gap: theme.spacing.sm },
  eyebrow: {
    color: '#5ed8ff',
    fontSize: theme.type.caption,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: { color: '#fff', fontSize: theme.type.title, fontWeight: '800' },
  body: { color: '#cbd5e1', fontSize: theme.type.body, lineHeight: 21 },
  section: {
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#24496b',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    backgroundColor: '#0c203a',
  },
  sectionHeading: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionEyebrow: {
    color: '#5ed8ff',
    fontSize: theme.type.caption,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  summaryCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 94,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: '#081827',
  },
  summaryValue: { fontSize: 25, fontWeight: '900' },
  summaryLabel: { color: '#d9e5f0', fontSize: theme.type.body, fontWeight: '700' },
  errorCard: {
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#ef5b72',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: '#341827',
  },
  errorTitle: { color: '#fff', fontSize: theme.type.body, fontWeight: '800' },
  errorBody: { color: '#fecdd3', lineHeight: 20 },
  retryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: '#ef5b72',
  },
  retryButtonText: { color: '#fff', fontWeight: '800' },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.selectedBorder,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  helperText: { color: '#9fb3c8', fontSize: theme.type.caption, lineHeight: 18 },
  signOutButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#64748b',
    borderRadius: theme.radius.md,
  },
  signOutButtonText: { color: '#e2e8f0', fontWeight: '700' },
});
