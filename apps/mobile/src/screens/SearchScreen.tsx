import React, { useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OwnershipMode } from '@pokemongonexus/shared-contracts/domain';
import type { SearchResultRow } from '@pokemongonexus/shared-contracts/search';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  buildPokemonSearchQuery,
  defaultSearchFormState,
  type BooleanFilter,
} from '../features/search/searchQueryBuilder';
import { searchPokemon } from '../services/searchService';
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;

const OWNERSHIP_MODES: OwnershipMode[] = ['caught', 'trade', 'wanted'];
const BOOL_OPTIONS: { label: string; value: 'true' | 'false' }[] = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];
const TRI_BOOL_OPTIONS: { label: string; value: BooleanFilter }[] = [
  { label: 'Any', value: 'any' },
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

export const SearchScreen = ({ navigation }: SearchScreenProps) => {
  const [formState, setFormState] = useState(defaultSearchFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultRow[]>([]);

  const setField = <K extends keyof typeof formState>(key: K, value: (typeof formState)[K]) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const queryPreview = useMemo(() => buildPokemonSearchQuery(formState), [formState]);

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const payload = await searchPokemon(queryPreview);
      setResults(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

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
        <Button title="Reset Filters" onPress={() => setFormState(defaultSearchFormState)} />
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

      {results.slice(0, 25).map((row, index) => (
        <View key={`${index}-${String(row.pokemon_id ?? 'x')}`} style={commonStyles.row}>
          <Text style={commonStyles.rowTitle}>pokemon_id: {String(row.pokemon_id ?? '-')}</Text>
          <Text style={commonStyles.rowSub}>distance: {String(row.distance ?? '-')}</Text>
          <Text style={commonStyles.rowSub}>{JSON.stringify(row).slice(0, 140)}</Text>
        </View>
      ))}
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
