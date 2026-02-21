import React, { useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';
import type { SearchResultRow } from '@pokemongonexus/shared-contracts/search';
import { SearchMapCanvas } from '../components/search/SearchMapCanvas';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  buildPokemonSearchQuery,
  defaultSearchFormState,
  type BooleanFilter,
} from '../features/search/searchQueryBuilder';
import { getSearchMapBounds, toSearchMapPoints } from '../features/search/searchMapModels';
import { searchPokemon } from '../services/searchService';
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
type SearchSortMode = 'distance_asc' | 'distance_desc' | 'pokemon_id_asc' | 'username_asc';
type SearchViewMode = 'list' | 'map';

const OWNERSHIP_MODES: OwnershipMode[] = ['caught', 'trade', 'wanted'];
const SORT_OPTIONS: { label: string; value: SearchSortMode }[] = [
  { label: 'distance asc', value: 'distance_asc' },
  { label: 'distance desc', value: 'distance_desc' },
  { label: 'pokemon asc', value: 'pokemon_id_asc' },
  { label: 'username asc', value: 'username_asc' },
];
const BOOL_OPTIONS: { label: string; value: 'true' | 'false' }[] = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];
const TRI_BOOL_OPTIONS: { label: string; value: BooleanFilter }[] = [
  { label: 'Any', value: 'any' },
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

const toNumberSafe = (value: unknown, fallback = Number.MAX_SAFE_INTEGER): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getResultUsername = (row: SearchResultRow): string | null => {
  const candidates = ['username', 'trainer_username', 'user_name'];
  for (const key of candidates) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
};

export const SearchScreen = ({ navigation }: SearchScreenProps) => {
  const [formState, setFormState] = useState(defaultSearchFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(25);
  const [selectedResult, setSelectedResult] = useState<SearchResultRow | null>(null);
  const [sortMode, setSortMode] = useState<SearchSortMode>('distance_asc');
  const [viewMode, setViewMode] = useState<SearchViewMode>('list');

  const setField = <K extends keyof typeof formState>(key: K, value: (typeof formState)[K]) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const queryPreview = useMemo(() => buildPokemonSearchQuery(formState), [formState]);

  const runSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    setError(null);
    setResults([]);
    setSelectedResult(null);
    setVisibleCount(25);
    setViewMode('list');

    try {
      const payload = await searchPokemon(queryPreview);
      setResults(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = useMemo(() => {
    const rows = [...results];
    switch (sortMode) {
      case 'distance_desc':
        return rows.sort((a, b) => toNumberSafe(b.distance, 0) - toNumberSafe(a.distance, 0));
      case 'pokemon_id_asc':
        return rows.sort((a, b) => toNumberSafe(a.pokemon_id) - toNumberSafe(b.pokemon_id));
      case 'username_asc':
        return rows.sort((a, b) => {
          const aUsername = getResultUsername(a) ?? '~';
          const bUsername = getResultUsername(b) ?? '~';
          return aUsername.localeCompare(bUsername);
        });
      case 'distance_asc':
      default:
        return rows.sort((a, b) => toNumberSafe(a.distance) - toNumberSafe(b.distance));
    }
  }, [results, sortMode]);
  const visibleResults = useMemo(() => sortedResults.slice(0, visibleCount), [sortedResults, visibleCount]);
  const hasMoreResults = visibleCount < results.length;
  const selectedUsername = useMemo(
    () => (selectedResult ? getResultUsername(selectedResult) : null),
    [selectedResult],
  );
  const mapPoints = useMemo(() => toSearchMapPoints(sortedResults), [sortedResults]);
  const mapBounds = useMemo(() => getSearchMapBounds(mapPoints), [mapPoints]);
  const selectedMarkerId = useMemo(() => {
    if (!selectedResult) return null;
    const point = mapPoints.find((candidate) => candidate.row === selectedResult);
    return point?.markerId ?? null;
  }, [mapPoints, selectedResult]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={commonStyles.title}>Search</Text>
      <Text style={commonStyles.subtitle}>Expanded mobile search parameters parity</Text>

      <View style={commonStyles.card}>
        <Text style={styles.sectionTitle}>Core</Text>
        <TextInput
          keyboardType="numeric"
          placeholder="Pokemon ID"
          value={formState.pokemonIdInput}
          onChangeText={(value) => setField('pokemonIdInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Latitude"
          value={formState.latitudeInput}
          onChangeText={(value) => setField('latitudeInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Longitude"
          value={formState.longitudeInput}
          onChangeText={(value) => setField('longitudeInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Range (km)"
          value={formState.rangeInput}
          onChangeText={(value) => setField('rangeInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Result limit"
          value={formState.limitInput}
          onChangeText={(value) => setField('limitInput', value)}
          style={commonStyles.input}
        />

        <View style={commonStyles.pillRow}>
          {OWNERSHIP_MODES.map((mode) => {
            const selected = mode === formState.ownershipMode;
            return (
              <Pressable
                key={mode}
                onPress={() => setField('ownershipMode', mode)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {mode}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={commonStyles.card}>
        <Text style={styles.sectionTitle}>Flags</Text>

        <Text style={commonStyles.caption}>Shiny</Text>
        <View style={commonStyles.pillRow}>
          {BOOL_OPTIONS.map((option) => {
            const selected = option.value === formState.shinyInput;
            return (
              <Pressable
                key={`shiny-${option.value}`}
                onPress={() => setField('shinyInput', option.value)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={commonStyles.caption}>Shadow</Text>
        <View style={commonStyles.pillRow}>
          {BOOL_OPTIONS.map((option) => {
            const selected = option.value === formState.shadowInput;
            return (
              <Pressable
                key={`shadow-${option.value}`}
                onPress={() => setField('shadowInput', option.value)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={commonStyles.caption}>Dynamax</Text>
        <View style={commonStyles.pillRow}>
          {BOOL_OPTIONS.map((option) => {
            const selected = option.value === formState.dynamaxInput;
            return (
              <Pressable
                key={`dynamax-${option.value}`}
                onPress={() => setField('dynamaxInput', option.value)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={commonStyles.caption}>Gigantamax</Text>
        <View style={commonStyles.pillRow}>
          {BOOL_OPTIONS.map((option) => {
            const selected = option.value === formState.gigantamaxInput;
            return (
              <Pressable
                key={`gigantamax-${option.value}`}
                onPress={() => setField('gigantamaxInput', option.value)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={commonStyles.card}>
        <Text style={styles.sectionTitle}>Optional Pokemon Fields</Text>
        <TextInput
          keyboardType="numeric"
          placeholder="Costume ID"
          value={formState.costumeIdInput}
          onChangeText={(value) => setField('costumeIdInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Fast Move ID"
          value={formState.fastMoveIdInput}
          onChangeText={(value) => setField('fastMoveIdInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Charged Move 1 ID"
          value={formState.chargedMove1Input}
          onChangeText={(value) => setField('chargedMove1Input', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Charged Move 2 ID"
          value={formState.chargedMove2Input}
          onChangeText={(value) => setField('chargedMove2Input', value)}
          style={commonStyles.input}
        />
        <TextInput
          autoCapitalize="none"
          placeholder="Gender"
          value={formState.genderInput}
          onChangeText={(value) => setField('genderInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Background ID"
          value={formState.backgroundIdInput}
          onChangeText={(value) => setField('backgroundIdInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Attack IV"
          value={formState.attackIvInput}
          onChangeText={(value) => setField('attackIvInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Defense IV"
          value={formState.defenseIvInput}
          onChangeText={(value) => setField('defenseIvInput', value)}
          style={commonStyles.input}
        />
        <TextInput
          keyboardType="numeric"
          placeholder="Stamina IV"
          value={formState.staminaIvInput}
          onChangeText={(value) => setField('staminaIvInput', value)}
          style={commonStyles.input}
        />
      </View>

      <View style={commonStyles.card}>
        <Text style={styles.sectionTitle}>Trade Filters</Text>

        <Text style={commonStyles.caption}>Only matching trades</Text>
        <View style={commonStyles.pillRow}>
          {TRI_BOOL_OPTIONS.map((option) => {
            const selected = option.value === formState.onlyMatchingTradesInput;
            return (
              <Pressable
                key={`onlyMatchingTrades-${option.value}`}
                onPress={() => setField('onlyMatchingTradesInput', option.value)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={commonStyles.caption}>Preferred lucky</Text>
        <View style={commonStyles.pillRow}>
          {TRI_BOOL_OPTIONS.map((option) => {
            const selected = option.value === formState.prefLuckyInput;
            return (
              <Pressable
                key={`prefLucky-${option.value}`}
                onPress={() => setField('prefLuckyInput', option.value)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={commonStyles.caption}>Already registered</Text>
        <View style={commonStyles.pillRow}>
          {TRI_BOOL_OPTIONS.map((option) => {
            const selected = option.value === formState.alreadyRegisteredInput;
            return (
              <Pressable
                key={`alreadyRegistered-${option.value}`}
                onPress={() => setField('alreadyRegisteredInput', option.value)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={commonStyles.caption}>Trade in wanted list</Text>
        <View style={commonStyles.pillRow}>
          {TRI_BOOL_OPTIONS.map((option) => {
            const selected = option.value === formState.tradeInWantedListInput;
            return (
              <Pressable
                key={`tradeInWantedList-${option.value}`}
                onPress={() => setField('tradeInWantedListInput', option.value)}
                style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
              >
                <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          keyboardType="numeric"
          placeholder="Friendship level"
          value={formState.friendshipLevelInput}
          onChangeText={(value) => setField('friendshipLevelInput', value)}
          style={commonStyles.input}
        />
      </View>

      <View style={commonStyles.actions}>
        <Button title={loading ? 'Searching...' : 'Search'} onPress={() => void runSearch()} />
        <Button
          title="Reset Filters"
          onPress={() => {
            setFormState(defaultSearchFormState);
            setResults([]);
            setHasSearched(false);
            setSelectedResult(null);
            setVisibleCount(25);
            setError(null);
            setViewMode('list');
          }}
        />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {error ? <Text style={commonStyles.error}>{error}</Text> : null}
      {!loading && !error ? (
        <Text style={commonStyles.caption}>
          Query: pokemon_id={queryPreview.pokemon_id}, ownership={queryPreview.ownership}, lat=
          {queryPreview.latitude}, lon={queryPreview.longitude}, limit={queryPreview.limit}
        </Text>
      ) : null}
      <Text style={commonStyles.caption}>Results: {results.length}</Text>
      {hasSearched && !loading && !error && results.length === 0 ? (
        <Text style={commonStyles.hint}>
          No matches found. Try increasing range, relaxing filters, or switching ownership mode.
        </Text>
      ) : null}
      {results.length > 0 ? (
        <>
          <Text style={commonStyles.caption}>View mode</Text>
          <View style={commonStyles.pillRow}>
            {(['list', 'map'] as const).map((mode) => {
              const selected = viewMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
                >
                  <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={commonStyles.caption}>Sort results by</Text>
          <View style={commonStyles.pillRow}>
            {SORT_OPTIONS.map((option) => {
              const selected = option.value === sortMode;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSortMode(option.value)}
                  style={[commonStyles.pill, selected ? commonStyles.pillSelected : null]}
                >
                  <Text style={[commonStyles.pillText, selected ? commonStyles.pillTextSelected : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {viewMode === 'list'
        ? visibleResults.map((row, index) => {
            const absoluteIndex = index;
            const isSelected = selectedResult === row;
            return (
              <Pressable
                key={`${absoluteIndex}-${String(row.pokemon_id ?? 'x')}`}
                onPress={() => setSelectedResult(row)}
                style={[commonStyles.row, isSelected ? commonStyles.rowSelected : null]}
              >
                <Text style={commonStyles.rowTitle}>pokemon_id: {String(row.pokemon_id ?? '-')}</Text>
                <Text style={commonStyles.rowSub}>distance: {String(row.distance ?? '-')}</Text>
                <Text style={commonStyles.rowSub}>{JSON.stringify(row).slice(0, 140)}</Text>
              </Pressable>
            );
          })
        : (
          <View style={commonStyles.card}>
            <Text style={styles.sectionTitle}>Map Preview</Text>
            <Text style={commonStyles.caption}>Map points: {mapPoints.length}</Text>
            {mapBounds ? (
              <Text style={commonStyles.rowSub}>
                Bounds lat[{mapBounds.minLat.toFixed(3)}, {mapBounds.maxLat.toFixed(3)}], lon[
                {mapBounds.minLon.toFixed(3)}, {mapBounds.maxLon.toFixed(3)}]
              </Text>
            ) : null}
            <SearchMapCanvas
              points={mapPoints}
              selectedMarkerId={selectedMarkerId}
              onSelect={(markerId) => {
                const point = mapPoints.find((candidate) => candidate.markerId === markerId);
                if (point) setSelectedResult(point.row);
              }}
            />
          </View>
        )}

      {hasMoreResults ? (
        <View style={commonStyles.actions}>
          <Button
            title={`Load More (${results.length - visibleCount} remaining)`}
            onPress={() => setVisibleCount((count) => count + 25)}
          />
        </View>
      ) : null}

      {selectedResult ? (
        <View style={commonStyles.card}>
          <Text style={styles.sectionTitle}>Selected Result</Text>
          <Text style={commonStyles.rowSub}>pokemon_id: {String(selectedResult.pokemon_id ?? '-')}</Text>
          <Text style={commonStyles.rowSub}>distance: {String(selectedResult.distance ?? '-')}</Text>
          <Text style={commonStyles.rowSub}>username: {selectedUsername ?? '-'}</Text>
          <Text style={commonStyles.rowSub}>{JSON.stringify(selectedResult, null, 2)}</Text>
          {selectedUsername ? (
            <Button
              title="Open Trainer Collection"
              onPress={() => navigation.navigate('PokemonCollection', { username: selectedUsername })}
            />
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
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
});
