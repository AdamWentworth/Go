import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type {
  NativeCollectionRow,
  NativeTagSummary,
} from '../../features/collection/collectionModel';
import { buildNativeCatalogRows } from '../../features/collection/collectionModel';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeCollectionHubScreen } from '../../screens/NativeCollectionHubScreen';
import { NativeInstanceDetailScreen } from '../../screens/NativeInstanceDetailScreen';

const ASSET_BASE_URL = 'https://pokegonexus.com';
const CATALOG_FIXTURE_URL = 'http://10.0.2.2:8092/pokemons.json';

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
  typeIconPaths = [],
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
  typeIconPaths?: string[];
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
  typeIconUris: typeIconPaths.map((path) => `${ASSET_BASE_URL}${path}`),
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
    typeIconPaths: ['/images/types/grass.png', '/images/types/poison.png'],
  }),
  row({
    id: 'smoke-gmax-charizard',
    pokemonId: 6,
    name: 'Shiny Gigantamax Charizard',
    imagePath: '/images/shiny_gigantamax/shiny_gigantamax_6.png',
    status: 'trade',
    maxKind: 'gigantamax',
    lucky: true,
    typeIconPaths: ['/images/types/fire.png', '/images/types/flying.png'],
  }),
  row({
    id: 'smoke-shadow-typhlosion',
    pokemonId: 157,
    name: 'Shiny Shadow Typhlosion',
    imagePath: '/images/shiny_shadow/shiny_shadow_pokemon_157.png',
    status: 'caught',
    favorite: true,
    typeIconPaths: ['/images/types/fire.png'],
  }),
  row({
    id: 'smoke-suicune',
    pokemonId: 245,
    name: 'Shiny Suicune',
    imagePath: '/images/shiny/shiny_pokemon_245.png',
    status: 'trade',
    typeIconPaths: ['/images/types/water.png'],
  }),
  row({
    id: 'smoke-metagross',
    pokemonId: 376,
    name: 'Shiny Metagross',
    imagePath: '/images/shiny/shiny_pokemon_376.png',
    status: 'caught',
    favorite: true,
    typeIconPaths: ['/images/types/steel.png', '/images/types/psychic.png'],
  }),
  row({
    id: 'smoke-rayquaza',
    pokemonId: 384,
    name: 'Shiny Rayquaza',
    imagePath: '/images/shiny/shiny_pokemon_384.png',
    status: 'trade',
    typeIconPaths: ['/images/types/dragon.png', '/images/types/flying.png'],
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
    typeIconPaths: ['/images/types/water.png'],
  }),
  row({
    id: 'smoke-pikachu',
    pokemonId: 25,
    name: 'Shiny Pikachu',
    imagePath: '/images/shiny/shiny_pokemon_25.png',
    status: 'wanted',
    cp: null,
    typeIconPaths: ['/images/types/electric.png'],
  }),
  row({
    id: 'smoke-mewtwo',
    pokemonId: 150,
    name: 'Shiny Mewtwo',
    imagePath: '/images/shiny/shiny_pokemon_150.png',
    status: 'wanted',
    cp: null,
    mostWanted: true,
    typeIconPaths: ['/images/types/psychic.png'],
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
  const [catalogRows, setCatalogRows] = useState<NativeCollectionRow[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    if (!runtimeConfig.mobile.deviceSmokeMode) return undefined;
    const controller = new AbortController();
    void fetch(CATALOG_FIXTURE_URL, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Catalog fixture returned ${response.status}.`);
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error('Catalog fixture is not an array.');
        setCatalogRows(buildNativeCatalogRows(payload as BasePokemon[], ASSET_BASE_URL));
        setCatalogError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setCatalogError(error instanceof Error ? error.message : 'Catalog fixture failed to load.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;

  return (
    <>
      <NativeCollectionHubScreen
        assetBaseUrl={ASSET_BASE_URL}
        catalogRows={catalogRows}
        error={catalogError}
        inventoryTags={INVENTORY_TAGS}
        isLoading={catalogLoading}
        onActionMenuPress={() => undefined}
        onCreateTag={async () => undefined}
        onDeleteTag={async () => undefined}
        onOpenEntry={setOpenedRow}
        onRetry={() => undefined}
        onSaveTagOrder={async () => undefined}
        onUpdateTag={async () => undefined}
        wishlistTags={WISHLIST_TAGS}
      />
      {openedRow ? (
        <Modal
          animationType="slide"
          onRequestClose={() => setOpenedRow(null)}
          presentationStyle="fullScreen"
          statusBarTranslucent
          visible
        >
          <NativeInstanceDetailScreen
            assetBaseUrl={ASSET_BASE_URL}
            cachedAt={null}
            detail={{
              row: openedRow,
              targetRows: openedRow.status === 'wanted'
                ? rowsWithStatus('trade')
                : openedRow.status === 'trade'
                  ? rowsWithStatus('wanted')
                  : [],
              traits: openedRow.name.includes('Shiny') ? ['Shiny'] : [],
              stats: openedRow.status === 'caught'
                ? [{ label: 'Level', value: '40' }]
                : [],
              ivs: openedRow.status === 'caught'
                ? [
                    { label: 'Attack', value: 15 },
                    { label: 'Defense', value: 12 },
                    { label: 'HP', value: 13 },
                  ]
                : [],
              moves: openedRow.status === 'caught'
                ? [
                    { label: 'Fast move', value: 'Vine Whip' },
                    { label: 'Charged move', value: 'Frenzy Plant' },
                  ]
                : [],
              preferences: openedRow.status === 'wanted'
                ? [
                    { label: 'Friendship', value: '4/5 hearts' },
                    { label: 'Lucky trade', value: 'Requested' },
                  ]
                : [],
              provenance: openedRow.status === 'caught'
                ? [
                    { label: 'Caught near', value: 'Burnaby, British Columbia, Canada' },
                    { label: 'Caught on', value: '2026-08-24' },
                  ]
                : [],
            }}
            error={null}
            isLoading={false}
            isSaving={false}
            movesWarning={null}
            onBack={() => setOpenedRow(null)}
            onEditInCurrentApp={() => undefined}
            onRetry={() => undefined}
            onToggleFavorite={() => undefined}
            saveError={null}
            saveNotice={null}
          />
        </Modal>
      ) : null}
    </>
  );
}
