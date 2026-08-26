import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { theme } from '../../ui/theme';
import { useNativeCollectionSync } from './NativeCollectionSyncProvider';

export const NativeCollectionSyncStatusCard = () => {
  const sync = useNativeCollectionSync();
  const light = useColorScheme() === 'light';
  const retainedCount = sync.pendingCount + sync.acceptedCount;
  if (!sync.isOffline && !sync.isSyncing && !sync.lastError && retainedCount === 0) {
    return null;
  }

  let title = 'Collection synchronization';
  let body = 'Checking retained changes…';
  if (sync.lastError) {
    title = 'Sync needs attention';
    body = sync.lastError;
  } else if (sync.isOffline) {
    title = 'You are offline';
    body = retainedCount > 0
      ? `${retainedCount} ${retainedCount === 1 ? 'change is' : 'changes are'} safely retained on this device.`
      : 'Your saved collection copy remains available on this device.';
  } else if (sync.isSyncing) {
    title = 'Syncing collection changes';
    body = retainedCount > 0
      ? `Checking ${retainedCount} retained ${retainedCount === 1 ? 'change' : 'changes'}…`
      : 'Checking Receiver and server reconciliation…';
  } else if (sync.pendingCount > 0) {
    title = 'Waiting to send';
    body = `${sync.pendingCount} ${sync.pendingCount === 1 ? 'change is' : 'changes are'} retained on this device.`;
  } else if (sync.acceptedCount > 0) {
    title = 'Accepted by Receiver';
    body = `${sync.acceptedCount} ${sync.acceptedCount === 1 ? 'change is' : 'changes are'} waiting for server confirmation.`;
  }

  const canRetry = !sync.isSyncing && (
    sync.lastError != null || sync.pendingCount > 0 || sync.acceptedCount > 0
  );
  return (
    <View accessibilityLiveRegion="polite" style={[styles.card, light && styles.cardLight]}>
      <View style={styles.copy}>
        <Text style={[styles.title, light && styles.titleLight]}>{title}</Text>
        <Text style={[styles.body, light && styles.bodyLight]}>{body}</Text>
      </View>
      {canRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void sync.retry()}
          style={({ pressed }) => [styles.retry, light && styles.retryLight, pressed && styles.retryPressed]}
        >
          <Text style={[styles.retryText, light && styles.retryTextLight]}>{sync.acceptedCount > 0 && !sync.lastError ? 'Check' : 'Retry'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#43708b',
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    backgroundColor: '#10283a',
  },
  cardLight: { borderColor: '#8fb8cb', backgroundColor: '#e7f5fb' },
  copy: { flex: 1, gap: 2 },
  title: { color: '#dff6ff', fontWeight: '900' },
  titleLight: { color: '#173a4b' },
  body: { color: '#9fc4d8', fontSize: theme.type.caption, lineHeight: 18 },
  bodyLight: { color: '#426b7e' },
  retry: {
    minWidth: 68,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4f9dcc',
    borderRadius: theme.radius.md,
    backgroundColor: '#173f5b',
  },
  retryPressed: { opacity: 0.7 },
  retryText: { color: '#fff', fontWeight: '900' },
  retryLight: { borderColor: '#5094b7', backgroundColor: '#d3ebf6' },
  retryTextLight: { color: '#173a4b' },
});
