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
import { commonStyles } from '../ui/commonStyles';

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
  const showNoAutocompleteResults =
    !searchLoading && !searchError && canSearch && results.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={commonStyles.title}>Trainer Search</Text>
      <Text style={commonStyles.subtitle}>Autocomplete + foreign instance lookup</Text>

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
        style={commonStyles.input}
      />

      {searchLoading ? <ActivityIndicator /> : null}
      {searchError ? <Text style={commonStyles.error}>{searchError}</Text> : null}
      {!canSearch ? (
        <Text style={commonStyles.hint}>Enter at least {MIN_QUERY_LEN} characters to search trainers.</Text>
      ) : null}

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
            style={[commonStyles.row, isSelected ? commonStyles.rowSelected : null]}
          >
            <Text style={commonStyles.rowTitle}>{trainer.username}</Text>
            <Text style={commonStyles.rowSub}>{trainer.pokemonGoName ?? '-'}</Text>
          </Pressable>
        );
      })}
      {showNoAutocompleteResults ? (
        <Text style={commonStyles.hint}>No trainers matched your query.</Text>
      ) : null}

      <View style={commonStyles.actions}>
        <Button
          title={lookupLoading ? 'Loading...' : 'Lookup Trainer'}
          onPress={() => void handleLookup()}
          disabled={lookupLoading || lookupUsername.trim().length === 0}
        />
        <Button
          title="Open Collection"
          onPress={() =>
            navigation.navigate('PokemonCollection', {
              username: lookupUsername.trim() || undefined,
            })
          }
          disabled={lookupUsername.trim().length === 0}
        />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {lookupError ? <Text style={commonStyles.error}>{lookupError}</Text> : null}

      {lookupSummary ? (
        <View style={commonStyles.card}>
          <Text style={commonStyles.cardTitle}>{lookupSummary.username}</Text>
          {summaryLines.map((line) => (
            <Text key={line} style={commonStyles.caption}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}

      {lookupSummary ? (
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
            Showing {visibleOwnershipItems.length} of {ownershipItems.length} matched instances.
          </Text>

          {visibleOwnershipItems.map((item) => (
            <View key={item.instanceId} style={commonStyles.row}>
              <Text style={commonStyles.rowTitle}>{item.variantId || '(missing variant_id)'}</Text>
              <Text style={commonStyles.rowSub}>instance_id: {item.instanceId}</Text>
            </View>
          ))}
          {visibleOwnershipItems.length === 0 ? (
            <Text style={commonStyles.hint}>No instances for the selected ownership mode.</Text>
          ) : null}
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
