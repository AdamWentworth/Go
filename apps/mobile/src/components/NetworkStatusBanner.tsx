import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNetwork } from '../features/network/NetworkProvider';
import { theme } from '../ui/theme';

const formatLastCheck = (timestamp: number | null): string => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString();
};

export const NetworkStatusBanner = () => {
  const { online, checking, lastError, lastCheckAt, refreshConnectivity } = useNetwork();

  if (online) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.banner}>
        <Text style={styles.title}>Connection issue detected</Text>
        <Text style={styles.meta}>Last check: {formatLastCheck(lastCheckAt)}</Text>
        {lastError ? <Text style={styles.meta}>{lastError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          style={[styles.retryButton, checking ? styles.retryButtonDisabled : null]}
          onPress={() => {
            void refreshConnectivity();
          }}
          disabled={checking}
        >
          <Text style={styles.retryText}>{checking ? 'Checking...' : 'Retry Connection'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 999,
  },
  banner: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    gap: 4,
  },
  title: {
    color: theme.colors.danger,
    fontWeight: '700',
    fontSize: theme.type.subtitle,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.surfaceAlt,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
});
