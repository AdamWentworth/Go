import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/AuthProvider';
import { useEvents } from '../features/events/EventsProvider';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, signOut } = useAuth();
  const { transport, connected, syncing, error, lastSyncAt, refreshNow } = useEvents();
  const openWebRoute = (title: string, path: string) => {
    navigation.navigate('WebApp', {
      title,
      path,
      username: user?.username,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={commonStyles.title}>Welcome</Text>
      <Text style={styles.username}>{user?.username ?? 'Trainer'}</Text>
      <Text style={commonStyles.caption}>Mobile parity workbench</Text>
      <View style={styles.syncCard}>
        <Text style={commonStyles.caption}>Realtime transport: {transport}</Text>
        <Text style={commonStyles.caption}>Realtime status: {connected ? 'connected' : 'degraded'}</Text>
        <Text style={commonStyles.caption}>
          Last sync: {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : '-'}
        </Text>
        {syncing ? <Text style={commonStyles.caption}>Syncing updates...</Text> : null}
        {error ? <Text style={commonStyles.error}>{error}</Text> : null}
        {!connected || Boolean(error) ? (
          <Button title="Retry Realtime Sync" onPress={() => void refreshNow()} />
        ) : null}
      </View>
      <Button title="Web: Home" onPress={() => openWebRoute('Web: Home', '/')} />
      <Button
        title="Web: Pokemon (Mine)"
        onPress={() => openWebRoute('Web: Pokemon (Mine)', '/pokemon')}
      />
      <Button
        title="Web: Pokemon (:username)"
        onPress={() => openWebRoute('Web: Pokemon (:username)', '/pokemon/:username')}
      />
      <Button title="Web: Search" onPress={() => openWebRoute('Web: Search', '/search')} />
      <Button title="Web: Trades" onPress={() => openWebRoute('Web: Trades', '/trades')} />
      <Button title="Web: Account" onPress={() => openWebRoute('Web: Account', '/account')} />
      <Text style={commonStyles.caption}>Native fallback/debug screens</Text>
      <Button title="Native: Trainer Search" onPress={() => navigation.navigate('TrainerSearch')} />
      <Button title="Native: Pokemon Catalog" onPress={() => navigation.navigate('PokemonCatalog')} />
      <Button title="Native: My Collection" onPress={() => navigation.navigate('PokemonCollection')} />
      <Button title="Native: Search" onPress={() => navigation.navigate('Search')} />
      <Button title="Native: Trades" onPress={() => navigation.navigate('Trades')} />
      <Button title="Native: Account" onPress={() => navigation.navigate('Account')} />
      <Button title="Sign Out" onPress={() => void signOut()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.centerContainer,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  syncCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
    gap: 4,
  },
});
