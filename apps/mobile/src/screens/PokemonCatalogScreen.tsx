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
const INITIAL_LOAD_RETRY_DELAY_MS = 500;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const PokemonCatalogScreen = ({ navigation }: PokemonCatalogScreenProps) => {
  const { user } = useAuth();
  const [pokemons, setPokemons] = useState<Pokemons>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const loadPokemons = async (allowRetry = true) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchPokemons();
      setPokemons(payload);
    } catch (nextError) {
      if (allowRetry) {
        await delay(INITIAL_LOAD_RETRY_DELAY_MS);
        return loadPokemons(false);
      }
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
      <Text style={commonStyles.subtitle}>Catalog browse + quick create from variant data</Text>

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
      {showNoData ? (
        <Text style={commonStyles.caption}>No pokemon data loaded yet.</Text>
      ) : null}
      {showNoMatches ? <Text style={commonStyles.caption}>No pokemon matched your filter.</Text> : null}

      <Text style={commonStyles.caption}>
        Showing {visibleItems.length} of {filteredItems.length} matched entries ({pokemons.length}{' '}
        total).
      </Text>

      <View style={styles.grid}>
        {visibleItems.map((item) => {
          const selected = selectedPokemonId === item.pokemonId;
          return (
            <Pressable
              key={`${item.pokemonId}-${item.displayName}`}
              onPress={() => setSelectedPokemonId(item.pokemonId)}
              style={[styles.card, selected ? styles.cardSelected : null]}
            >
              <View style={styles.imageFrame}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.imageFallback}>?</Text>
                )}
              </View>
              <Text style={styles.cardId}>#{item.pokemonId}</Text>
              <Text style={styles.cardName} numberOfLines={2}>
                {item.displayName}
              </Text>
              <View style={styles.typeRow}>
                {item.types.length > 0 ? (
                  item.types.map((typeName) => (
                    <View key={`${item.pokemonId}-${typeName}`} style={styles.typeChip}>
                      <Text style={styles.typeChipText}>{typeName}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.typeChip}>
                    <Text style={styles.typeChipText}>Unknown</Text>
                  </View>
                )}
              </View>
              <Text style={styles.hiddenAccessibilityText}>#{item.pokemonId} {item.displayName}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedDetail ? (
        <View style={commonStyles.card}>
          <Text style={styles.detailTitle}>{selectedDetail.displayName}</Text>
          {selectedDetail.imageUrl ? (
            <View style={styles.detailImageFrame}>
              <Image source={{ uri: selectedDetail.imageUrl }} style={styles.detailImage} resizeMode="contain" />
            </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '48%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  cardSelected: {
    borderColor: theme.colors.selectedBorder,
    backgroundColor: theme.colors.selectedSurface,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '90%',
    height: '90%',
  },
  imageFallback: {
    color: theme.colors.textSecondary,
    fontSize: 28,
    fontWeight: '700',
  },
  cardId: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  cardName: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    minHeight: 36,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  hiddenAccessibilityText: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  detailImageFrame: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailImage: {
    width: 124,
    height: 124,
  },
  detailLine: {
    color: theme.colors.textTertiary,
  },
});
