import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  NativeCollectionRow,
  NativeTagSummary,
} from '../../features/collection/collectionModel';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeCollectionHubScreen } from '../../screens/NativeCollectionHubScreen';

const ASSET_BASE_URL = 'https://pokegonexus.com';

const row = ({
  id,
  pokemonId,
  name,
  imagePath,
  status,
  cp = 2500,
  favorite = false,
  mostWanted = false,
  lucky = false,
  maxKind = null,
}: {
  id: string;
  pokemonId: number;
  name: string;
  imagePath: string;
  status: NativeCollectionRow['status'];
  cp?: number | null;
  favorite?: boolean;
  mostWanted?: boolean;
  lucky?: boolean;
  maxKind?: NativeCollectionRow['maxKind'];
}): NativeCollectionRow => ({
  id,
  pokemonId,
  pokedexNumber: pokemonId,
  name,
  imageUri: `${ASSET_BASE_URL}${imagePath}`,
  locationBackgroundUri: null,
  maxKind,
  purified: false,
  lucky,
  typeIconUris: [],
  status,
  source: 'instance',
  cp,
  favorite,
  mostWanted,
});

const ROWS: NativeCollectionRow[] = [
  row({
    id: 'smoke-shadow-venusaur',
    pokemonId: 3,
    name: 'Shiny Shadow Venusaur',
    imagePath: '/images/shiny_shadow/shiny_shadow_pokemon_3.png',
    status: 'caught',
    favorite: true,
  }),
  row({
    id: 'smoke-gmax-charizard',
    pokemonId: 6,
    name: 'Shiny Gigantamax Charizard',
    imagePath: '/images/shiny_gigantamax/shiny_gigantamax_6.png',
    status: 'trade',
    maxKind: 'gigantamax',
    lucky: true,
  }),
  row({
    id: 'smoke-shadow-typhlosion',
    pokemonId: 157,
    name: 'Shiny Shadow Typhlosion',
    imagePath: '/images/shiny_shadow/shiny_shadow_pokemon_157.png',
    status: 'caught',
    favorite: true,
  }),
  row({
    id: 'smoke-suicune',
    pokemonId: 245,
    name: 'Shiny Suicune',
    imagePath: '/images/shiny/shiny_pokemon_245.png',
    status: 'trade',
  }),
  row({
    id: 'smoke-metagross',
    pokemonId: 376,
    name: 'Shiny Metagross',
    imagePath: '/images/shiny/shiny_pokemon_376.png',
    status: 'caught',
    favorite: true,
  }),
  row({
    id: 'smoke-rayquaza',
    pokemonId: 384,
    name: 'Shiny Rayquaza',
    imagePath: '/images/shiny/shiny_pokemon_384.png',
    status: 'trade',
  }),
  row({
    id: 'smoke-gmax-blastoise',
    pokemonId: 9,
    name: 'Gigantamax Blastoise',
    imagePath: '/images/gigantamax/gigantamax_9.png',
    status: 'wanted',
    cp: null,
    maxKind: 'gigantamax',
    mostWanted: true,
  }),
  row({
    id: 'smoke-pikachu',
    pokemonId: 25,
    name: 'Shiny Pikachu',
    imagePath: '/images/shiny/shiny_pokemon_25.png',
    status: 'wanted',
    cp: null,
  }),
  row({
    id: 'smoke-mewtwo',
    pokemonId: 150,
    name: 'Shiny Mewtwo',
    imagePath: '/images/shiny/shiny_pokemon_150.png',
    status: 'wanted',
    cp: null,
    mostWanted: true,
  }),
];

const rowsWithStatus = (status: NativeCollectionRow['status']) =>
  ROWS.filter((candidate) => candidate.status === status);

const INVENTORY_TAGS: NativeTagSummary[] = [
  {
    key: 'system:favorites',
    parent: 'caught',
    name: 'Favorites',
    color: '#ffd45a',
    tone: 'favorites',
    rows: ROWS.filter((candidate) => candidate.favorite),
  },
  {
    key: 'system:trade',
    parent: 'caught',
    name: 'For Trade',
    color: '#4bc574',
    tone: 'trade',
    rows: rowsWithStatus('trade'),
  },
  {
    key: 'system:caught',
    parent: 'caught',
    name: 'All Caught',
    color: '#5798ff',
    tone: 'caught',
    rows: ROWS.filter((candidate) => candidate.status !== 'wanted'),
  },
  {
    key: 'custom:shadow-shinies',
    parent: 'caught',
    name: 'Shadow Shinies',
    color: '#6f35c5',
    tone: 'custom',
    rows: ROWS.filter((candidate) => candidate.name.includes('Shadow')),
  },
];

const WISHLIST_TAGS: NativeTagSummary[] = [
  {
    key: 'system:wanted',
    parent: 'wanted',
    name: 'All Wanted',
    color: '#ef5b72',
    tone: 'wanted',
    rows: rowsWithStatus('wanted'),
  },
  {
    key: 'system:most-wanted',
    parent: 'wanted',
    name: 'Most Wanted',
    color: '#ff704d',
    tone: 'most-wanted',
    rows: ROWS.filter((candidate) => candidate.mostWanted),
  },
];

export default function DeviceSmokeCollectionRoute() {
  const [openedRow, setOpenedRow] = useState<NativeCollectionRow | null>(null);

  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;

  return (
    <>
      <NativeCollectionHubScreen
        assetBaseUrl={ASSET_BASE_URL}
        catalogRows={ROWS}
        error={null}
        inventoryTags={INVENTORY_TAGS}
        isLoading={false}
        onActionMenuPress={() => undefined}
        onOpenEntry={setOpenedRow}
        onRetry={() => undefined}
        wishlistTags={WISHLIST_TAGS}
      />
      <Modal
        animationType="fade"
        onRequestClose={() => setOpenedRow(null)}
        transparent
        visible={Boolean(openedRow)}
      >
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.confirmation}>
            <Text accessibilityRole="header" style={styles.confirmationTitle}>
              {openedRow ? `Opened ${openedRow.name}` : ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpenedRow(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close smoke detail</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  confirmation: {
    width: '100%',
    maxWidth: 420,
    gap: 18,
    borderWidth: 1,
    borderColor: '#42d4c4',
    borderRadius: 18,
    padding: 24,
    backgroundColor: '#101a2a',
  },
  confirmationTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  closeButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#42d4c4',
  },
  closeButtonText: { color: '#06162f', fontWeight: '900' },
});
