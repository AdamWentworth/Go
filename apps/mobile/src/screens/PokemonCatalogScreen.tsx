import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Pokemons } from '@pokemongonexus/shared-contracts/pokemon';
import { useAuth } from '../features/auth/AuthProvider';
import {
  createInstanceFromPokemon,
} from '../features/instances/createInstanceFromPokemon';
import {
  toReceiverPokemonPayload,
  type InstanceStatusMutation,
} from '../features/instances/instanceMutations';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  findPokemonById,
  toPokemonDetail,
  toPokemonList,
} from '../features/pokemon/pokemonReadModels';
import { fetchPokemons } from '../services/pokemonService';
import { sendPokemonUpdate } from '../services/receiverService';
import { commonStyles } from '../ui/commonStyles';
import { theme } from '../ui/theme';

type PokemonCatalogScreenProps = NativeStackScreenProps<RootStackParamList, 'PokemonCatalog'>;

const MAX_VISIBLE_ROWS = 120;

export const PokemonCatalogScreen = ({ navigation }: PokemonCatalogScreenProps) => {
  const { user } = useAuth();
  const [pokemons, setPokemons] = useState<Pokemons>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const loadPokemons = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchPokemons();
      setPokemons(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Failed to load pokemon data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPokemons();
  }, []);

  const listItems = useMemo(() => toPokemonList(pokemons), [pokemons]);

  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return listItems;
    return listItems.filter((item) => item.displayName.toLowerCase().includes(trimmed));
  }, [listItems, query]);

  const visibleItems = filteredItems.slice(0, MAX_VISIBLE_ROWS);
  const showNoData = !loading && !error && pokemons.length === 0;
  const showNoMatches = !loading && !error && pokemons.length > 0 && filteredItems.length === 0;

  const selectedDetail = useMemo(() => {
    const pokemon = findPokemonById(pokemons, selectedPokemonId);
    return pokemon ? toPokemonDetail(pokemon) : null;
  }, [pokemons, selectedPokemonId]);

  const selectedPokemon = useMemo(
    () => findPokemonById(pokemons, selectedPokemonId),
    [pokemons, selectedPokemonId],
  );

  const createInstance = async (status: InstanceStatusMutation) => {
    if (!selectedPokemon || !user?.user_id || createLoading) return;
    setCreateLoading(true);
    setCreateMessage(null);
    setError(null);
    try {
      const instance = createInstanceFromPokemon(selectedPokemon, status);
      await sendPokemonUpdate(toReceiverPokemonPayload(instance));
      setCreateMessage(
        `Created ${status} instance ${instance.instance_id} (${instance.variant_id}).`,
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Failed to create instance.',
      );
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={commonStyles.title}>Pokemon Catalog</Text>
      <Text style={commonStyles.subtitle}>Read-only base pokemon detail path</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Filter by name..."
        value={query}
        onChangeText={setQuery}
        style={commonStyles.input}
      />

      <View style={commonStyles.actions}>
        <Button title={loading ? 'Refreshing...' : 'Refresh'} onPress={() => void loadPokemons()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={commonStyles.error}>{error}</Text> : null}
      {createMessage ? <Text style={commonStyles.success}>{createMessage}</Text> : null}
      {showNoData ? <Text style={commonStyles.caption}>No pokemon data loaded yet.</Text> : null}
      {showNoMatches ? <Text style={commonStyles.caption}>No pokemon matched your filter.</Text> : null}

      <Text style={commonStyles.caption}>
        Showing {visibleItems.length} of {filteredItems.length} matched entries ({pokemons.length}{' '}
        total).
      </Text>

      <View style={styles.list}>
        {visibleItems.map((item) => {
          const selected = selectedPokemonId === item.pokemonId;
          return (
            <Pressable
              key={`${item.pokemonId}-${item.displayName}`}
              onPress={() => setSelectedPokemonId(item.pokemonId)}
              style={[commonStyles.row, selected ? commonStyles.rowSelected : null]}
            >
              <Text style={commonStyles.rowTitle}>
                #{item.pokemonId} {item.displayName}
              </Text>
              <Text style={commonStyles.rowSub}>{item.types.join(' / ') || '-'}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedDetail ? (
        <View style={commonStyles.card}>
          <Text style={styles.detailTitle}>{selectedDetail.displayName}</Text>
          {selectedDetail.imageUrl ? (
            <Image source={{ uri: selectedDetail.imageUrl }} style={styles.detailImage} />
          ) : null}
          <Text style={styles.detailLine}>Pokedex #{selectedDetail.pokedexNumber}</Text>
          <Text style={styles.detailLine}>
            Types: {selectedDetail.types.join(' / ') || '-'}
          </Text>
          <Text style={styles.detailLine}>
            Stats: ATK {selectedDetail.attack} DEF {selectedDetail.defense} STA {selectedDetail.stamina}
          </Text>
          <Text style={styles.detailLine}>
            CP: {selectedDetail.cp40} (40) / {selectedDetail.cp50} (50)
          </Text>
          <Text style={styles.detailLine}>
            Fast moves: {selectedDetail.fastMoves.slice(0, 6).join(', ') || '-'}
          </Text>
          <Text style={styles.detailLine}>
            Charged moves: {selectedDetail.chargedMoves.slice(0, 6).join(', ') || '-'}
          </Text>
          <Text style={styles.detailLine}>
            Flags: shiny={selectedDetail.shinyAvailable ? 'yes' : 'no'} shadow_shiny=
            {selectedDetail.shadowShinyAvailable ? 'yes' : 'no'} mega=
            {selectedDetail.hasMegaEvolution ? 'yes' : 'no'} fusion=
            {selectedDetail.hasFusion ? 'yes' : 'no'}
          </Text>
          <View style={commonStyles.actions}>
            <Button
              title={createLoading ? 'Creating...' : 'Create Caught Instance'}
              onPress={() => void createInstance('caught')}
              disabled={createLoading || !user?.user_id}
            />
            <Button
              title="Create Trade Instance"
              onPress={() => void createInstance('trade')}
              disabled={createLoading || !user?.user_id}
            />
            <Button
              title="Create Wanted Instance"
              onPress={() => void createInstance('wanted')}
              disabled={createLoading || !user?.user_id}
            />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
  },
  list: {
    gap: 8,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  detailImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
  },
  detailLine: {
    color: theme.colors.textTertiary,
  },
});
