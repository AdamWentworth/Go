import React, { useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';
import { useAuth } from '../features/auth/AuthProvider';
import {
  filterInstancesByOwnership,
  toInstanceListItems,
  type InstanceListItem,
} from '../features/instances/instanceReadModels';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { fetchForeignInstancesByUsername } from '../services/userSearchService';
import { fetchUserOverview } from '../services/userOverviewService';
import { commonStyles } from '../ui/commonStyles';

type PokemonCollectionScreenProps = NativeStackScreenProps<RootStackParamList, 'PokemonCollection'>;

const OWNERSHIP_MODES: OwnershipMode[] = ['caught', 'trade', 'wanted'];
const MAX_ROWS = 120;

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

export const PokemonCollectionScreen = ({ navigation, route }: PokemonCollectionScreenProps) => {
  const { user } = useAuth();
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('caught');
  const [usernameInput, setUsernameInput] = useState(route.params?.username ?? '');
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [items, setItems] = useState<InstanceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollection = async () => {
    setLoading(true);
    setError(null);

    try {
      const normalized = usernameInput.trim();
      if (normalized.length > 0) {
        const outcome = await fetchForeignInstancesByUsername(normalized);
        if (outcome.type !== 'success') {
          setItems([]);
          if (outcome.type === 'notFound') setError('Trainer not found.');
          else if (outcome.type === 'forbidden') setError('Trainer collection is private.');
          else setError('Unable to load trainer collection.');
          return;
        }
        setActiveUsername(outcome.username);
        setItems(toInstanceListItems(outcome.instances));
        return;
      }

      if (!user?.user_id) {
        setItems([]);
        setError('You must be authenticated to load your collection.');
        return;
      }

      const overview = await fetchUserOverview(user.user_id);
      setActiveUsername(overview.user?.username ?? user.username ?? null);
      setItems(toInstanceListItems(overview.pokemon_instances ?? {}));
    } catch (nextError) {
      setItems([]);
      setError(nextError instanceof Error ? nextError.message : 'Failed to load collection.');
    } finally {
      setLoading(false);
    }
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
          {visible.map((item) => (
            <View key={item.instanceId} style={commonStyles.row}>
              <Text style={commonStyles.rowTitle}>{item.variantId || '(missing variant_id)'}</Text>
              <Text style={commonStyles.rowSub}>instance_id: {item.instanceId}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
  },
});
