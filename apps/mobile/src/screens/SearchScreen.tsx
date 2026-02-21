import React, { useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';
import type { PokemonSearchQueryParams, SearchResultRow } from '@pokemongonexus/shared-contracts/search';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { searchPokemon } from '../services/searchService';

type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;

const OWNERSHIP_MODES: OwnershipMode[] = ['caught', 'trade', 'wanted'];

const toNumber = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const SearchScreen = ({ navigation }: SearchScreenProps) => {
  const [pokemonIdInput, setPokemonIdInput] = useState('1');
  const [latitudeInput, setLatitudeInput] = useState('0');
  const [longitudeInput, setLongitudeInput] = useState('0');
  const [rangeInput, setRangeInput] = useState('100');
  const [limitInput, setLimitInput] = useState('50');
  const [ownershipMode, setOwnershipMode] = useState<OwnershipMode>('caught');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultRow[]>([]);

  const queryPreview = useMemo(
    () => ({
      pokemonId: toNumber(pokemonIdInput, 1),
      ownershipMode,
      latitude: toNumber(latitudeInput, 0),
      longitude: toNumber(longitudeInput, 0),
      rangeKm: toNumber(rangeInput, 100),
      limit: toNumber(limitInput, 50),
    }),
    [pokemonIdInput, ownershipMode, latitudeInput, longitudeInput, rangeInput, limitInput],
  );

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const query: PokemonSearchQueryParams = {
        pokemon_id: queryPreview.pokemonId,
        shiny: false,
        shadow: false,
        costume_id: null,
        fast_move_id: null,
        charged_move_1_id: null,
        charged_move_2_id: null,
        gender: null,
        background_id: null,
        attack_iv: null,
        defense_iv: null,
        stamina_iv: null,
        only_matching_trades: null,
        pref_lucky: null,
        friendship_level: null,
        already_registered: null,
        trade_in_wanted_list: null,
        latitude: queryPreview.latitude,
        longitude: queryPreview.longitude,
        ownership: queryPreview.ownershipMode,
        range_km: queryPreview.rangeKm,
        limit: queryPreview.limit,
        dynamax: false,
        gigantamax: false,
      };

      const payload = await searchPokemon(query);
      setResults(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Mobile baseline for pokemon search endpoint</Text>

      <TextInput
        keyboardType="numeric"
        placeholder="Pokemon ID"
        value={pokemonIdInput}
        onChangeText={setPokemonIdInput}
        style={styles.input}
      />
      <TextInput
        keyboardType="numeric"
        placeholder="Latitude"
        value={latitudeInput}
        onChangeText={setLatitudeInput}
        style={styles.input}
      />
      <TextInput
        keyboardType="numeric"
        placeholder="Longitude"
        value={longitudeInput}
        onChangeText={setLongitudeInput}
        style={styles.input}
      />
      <TextInput
        keyboardType="numeric"
        placeholder="Range (km)"
        value={rangeInput}
        onChangeText={setRangeInput}
        style={styles.input}
      />
      <TextInput
        keyboardType="numeric"
        placeholder="Result limit"
        value={limitInput}
        onChangeText={setLimitInput}
        style={styles.input}
      />

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

      <View style={styles.actions}>
        <Button title={loading ? 'Searching...' : 'Search'} onPress={() => void runSearch()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error ? (
        <Text style={styles.caption}>
          Query: pokemon_id={queryPreview.pokemonId}, ownership={queryPreview.ownershipMode}, lat=
          {queryPreview.latitude}, lon={queryPreview.longitude}
        </Text>
      ) : null}
      <Text style={styles.caption}>Results: {results.length}</Text>

      {results.slice(0, 25).map((row, index) => (
        <View key={`${index}-${String(row.pokemon_id ?? 'x')}`} style={styles.resultRow}>
          <Text style={styles.resultPrimary}>pokemon_id: {String(row.pokemon_id ?? '-')}</Text>
          <Text style={styles.resultSecondary}>distance: {String(row.distance ?? '-')}</Text>
          <Text style={styles.resultSecondary}>{JSON.stringify(row).slice(0, 140)}</Text>
        </View>
      ))}
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
  actions: {
    gap: 8,
  },
  error: {
    color: '#b00020',
  },
  caption: {
    color: '#374151',
  },
  resultRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    gap: 2,
  },
  resultPrimary: {
    fontWeight: '600',
  },
  resultSecondary: {
    color: '#6b7280',
    fontSize: 12,
  },
});

