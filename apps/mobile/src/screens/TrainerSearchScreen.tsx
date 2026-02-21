import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';
import type { InstancesMap } from '@pokemongonexus/shared-contracts/instances';
import type { TrainerAutocompleteEntry } from '@pokemongonexus/shared-contracts/users';
import {
  filterInstancesByOwnership,
  toInstanceListItems,
  type InstanceListItem,
} from '../features/instances/instanceReadModels';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  fetchForeignInstancesByUsername,
  fetchTrainerAutocomplete,
} from '../services/userSearchService';

type TrainerSearchScreenProps = NativeStackScreenProps<RootStackParamList, 'TrainerSearch'>;

type LookupSummary = {
  username: string;
  total: number;
  caught: number;
  trade: number;
  wanted: number;
  sampleVariantIds: string[];
};

const MIN_QUERY_LEN = 2;
const DEBOUNCE_MS = 300;
const MAX_VISIBLE_INSTANCES = 80;
const OWNERSHIP_MODES: OwnershipMode[] = ['caught', 'trade', 'wanted'];

const summarizeInstances = (username: string, instances: InstancesMap): LookupSummary => {
  const values = Object.values(instances);
  let caught = 0;
  let trade = 0;
  let wanted = 0;

  for (const instance of values) {
    if (instance?.is_caught) caught += 1;
    if (instance?.is_for_trade) trade += 1;
    if (instance?.is_wanted) wanted += 1;
  }

  return {
    username,
    total: values.length,
    caught,
    trade,
    wanted,
    sampleVariantIds: values
      .map((instance) => instance?.variant_id)
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .slice(0, 6),
  };
};

export const TrainerSearchScreen = ({ navigation }: TrainerSearchScreenProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrainerAutocompleteEntry[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSummary, setLookupSummary] = useState<LookupSummary | null>(null);
  const [lookupInstances, setLookupInstances] = useState<InstanceListItem[]>([]);
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('caught');

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= MIN_QUERY_LEN;
  const lookupUsername = selectedUsername ?? trimmedQuery;

  const runAutocomplete = useCallback(async (term: string) => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const outcome = await fetchTrainerAutocomplete(term);
      if (outcome.type === 'error') {
        setResults([]);
        setSearchError(outcome.message);
        return;
      }

      setResults(outcome.results);
      setSearchError(null);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      void runAutocomplete(trimmedQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [canSearch, runAutocomplete, trimmedQuery]);

  const handleLookup = useCallback(async () => {
    if (!lookupUsername) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupSummary(null);
    setLookupInstances([]);

    try {
      const outcome = await fetchForeignInstancesByUsername(lookupUsername);
      if (outcome.type === 'success') {
        setSelectedUsername(outcome.username);
        setLookupSummary(summarizeInstances(outcome.username, outcome.instances));
        setLookupInstances(toInstanceListItems(outcome.instances));
        return;
      }
      if (outcome.type === 'notFound') {
        setLookupError('Trainer was not found.');
        return;
      }
      if (outcome.type === 'forbidden') {
        setLookupError('This trainer data is not available without authentication.');
        return;
      }
      if (outcome.type === 'notModified') {
        setLookupError('No updates available for this trainer right now.');
        return;
      }

      setLookupError(`Lookup failed (${outcome.status} ${outcome.statusText})`);
    } finally {
      setLookupLoading(false);
    }
  }, [lookupUsername]);

  const summaryLines = useMemo(() => {
    if (!lookupSummary) return [];
    const lines = [
      `Total instances: ${lookupSummary.total}`,
      `Caught: ${lookupSummary.caught}`,
      `For trade: ${lookupSummary.trade}`,
      `Wanted: ${lookupSummary.wanted}`,
    ];
    if (lookupSummary.sampleVariantIds.length > 0) {
      lines.push(`Sample variants: ${lookupSummary.sampleVariantIds.join(', ')}`);
    }
    return lines;
  }, [lookupSummary]);

  const ownershipItems = useMemo(
    () => filterInstancesByOwnership(lookupInstances, ownershipMode),
    [lookupInstances, ownershipMode],
  );
  const visibleOwnershipItems = ownershipItems.slice(0, MAX_VISIBLE_INSTANCES);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Trainer Search</Text>
      <Text style={styles.subtitle}>Autocomplete + foreign instance lookup</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Search trainer username..."
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setSelectedUsername(null);
          setLookupSummary(null);
          setLookupInstances([]);
          setLookupError(null);
        }}
        style={styles.input}
      />

      {searchLoading ? <ActivityIndicator /> : null}
      {searchError ? <Text style={styles.error}>{searchError}</Text> : null}

      {results.map((trainer) => {
        const isSelected = selectedUsername?.toLowerCase() === trainer.username.toLowerCase();
        return (
          <Pressable
            key={trainer.username}
            onPress={() => {
              setSelectedUsername(trainer.username);
              setQuery(trainer.username);
              setLookupSummary(null);
              setLookupInstances([]);
              setLookupError(null);
            }}
            style={[styles.resultRow, isSelected ? styles.resultRowSelected : null]}
          >
            <Text style={styles.resultPrimary}>{trainer.username}</Text>
            <Text style={styles.resultSecondary}>{trainer.pokemonGoName ?? '-'}</Text>
          </Pressable>
        );
      })}

      <View style={styles.actions}>
        <Button
          title={lookupLoading ? 'Loading...' : 'Lookup Trainer'}
          onPress={() => void handleLookup()}
          disabled={lookupLoading || lookupUsername.trim().length === 0}
        />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {lookupError ? <Text style={styles.error}>{lookupError}</Text> : null}

      {lookupSummary ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{lookupSummary.username}</Text>
          {summaryLines.map((line) => (
            <Text key={line} style={styles.summaryLine}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {lookupSummary ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Instances ({ownershipMode})</Text>
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

          <Text style={styles.summaryLine}>
            Showing {visibleOwnershipItems.length} of {ownershipItems.length} matched instances.
          </Text>

          {visibleOwnershipItems.map((item) => (
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
    color: '#666',
    marginBottom: 6,
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
    marginTop: 8,
  },
  error: {
    color: '#b00020',
    marginTop: 4,
  },
  resultRow: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
  resultRowSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  resultPrimary: {
    fontWeight: '600',
  },
  resultSecondary: {
    color: '#666',
    marginTop: 2,
  },
  summaryCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryLine: {
    color: '#333',
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
