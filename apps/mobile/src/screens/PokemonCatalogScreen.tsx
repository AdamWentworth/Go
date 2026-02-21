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
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  findPokemonById,
  toPokemonDetail,
  toPokemonList,
} from '../features/pokemon/pokemonReadModels';
import { fetchPokemons } from '../services/pokemonService';

type PokemonCatalogScreenProps = NativeStackScreenProps<RootStackParamList, 'PokemonCatalog'>;

const MAX_VISIBLE_ROWS = 120;

export const PokemonCatalogScreen = ({ navigation }: PokemonCatalogScreenProps) => {
  const [pokemons, setPokemons] = useState<Pokemons>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);

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

  const selectedDetail = useMemo(() => {
    const pokemon = findPokemonById(pokemons, selectedPokemonId);
    return pokemon ? toPokemonDetail(pokemon) : null;
  }, [pokemons, selectedPokemonId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pokemon Catalog</Text>
      <Text style={styles.subtitle}>Read-only base pokemon detail path</Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Filter by name..."
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      <View style={styles.actions}>
        <Button title={loading ? 'Refreshing...' : 'Refresh'} onPress={() => void loadPokemons()} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>

      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.caption}>
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
              style={[styles.row, selected ? styles.rowSelected : null]}
            >
              <Text style={styles.rowTitle}>
                #{item.pokemonId} {item.displayName}
              </Text>
              <Text style={styles.rowSub}>{item.types.join(' / ') || '-'}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedDetail ? (
        <View style={styles.detailCard}>
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
    color: '#666',
  },
  list: {
    gap: 8,
  },
  row: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
  rowSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  rowTitle: {
    fontWeight: '600',
  },
  rowSub: {
    color: '#666',
    marginTop: 2,
  },
  detailCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    gap: 4,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  detailImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
  },
  detailLine: {
    color: '#333',
  },
});

