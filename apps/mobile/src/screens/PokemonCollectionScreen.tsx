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
      <Text style={styles.title}>Pokemon Collection</Text>
      <Text style={styles.subtitle}>Use blank username to load your own collection</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Foreign username (optional)"
        value={usernameInput}
        onChangeText={setUsernameInput}
        style={styles.input}
      />

      <View style={styles.actions}>
        <Button title={loading ? 'Loading...' : 'Load Collection'} onPress={() => void loadCollection()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {activeUsername ? <Text style={styles.caption}>Active trainer: {activeUsername}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && items.length === 0 ? (
        <Text style={styles.caption}>No instances loaded yet.</Text>
      ) : null}

      {items.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Summary</Text>
          <Text style={styles.caption}>Total: {summary.total}</Text>
          <Text style={styles.caption}>Caught: {summary.caught}</Text>
          <Text style={styles.caption}>Trade: {summary.trade}</Text>
          <Text style={styles.caption}>Wanted: {summary.wanted}</Text>
        </View>
      ) : null}

      {items.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instances ({ownershipMode})</Text>
          <View style={styles.modeRow}>
            {OWNERSHIP_MODES.map((mode) => {
              const selected = mode === ownershipMode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setOwnershipMode(mode)}
                  style={[styles.modePill, selected ? styles.modePillSelected : null]}
                >
                  <Text style={[styles.modePillText, selected ? styles.modePillTextSelected : null]}>
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.caption}>
            Showing {visible.length} of {filtered.length} rows.
          </Text>
          {visible.map((item) => (
            <View key={item.instanceId} style={styles.instanceRow}>
              <Text style={styles.instancePrimary}>{item.variantId || '(missing variant_id)'}</Text>
              <Text style={styles.instanceSecondary}>instance_id: {item.instanceId}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  actions: {
    gap: 8,
  },
  error: {
    color: '#b00020',
  },
  caption: {
    color: '#374151',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  modePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9ca3af',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f3f4f6',
  },
  modePillSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  modePillText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  modePillTextSelected: {
    color: '#1d4ed8',
  },
  instanceRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  instancePrimary: {
    fontWeight: '600',
  },
  instanceSecondary: {
    color: '#6b7280',
    fontSize: 12,
  },
});

