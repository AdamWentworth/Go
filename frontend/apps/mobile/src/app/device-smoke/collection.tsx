import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
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
    maxKind: 'dynamax',
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
    id: 'smoke-zacian',
    pokemonId: 888,
    name: 'Shiny Zacian',
    imagePath: '/images/shiny/shiny_pokemon_2290.png',
    status: 'caught',
    typeIconPaths: ['/images/types/fairy.png'],
  }),
  row({
    id: 'smoke-necrozma',
    pokemonId: 800,
    name: 'Necrozma',
    imagePath: '/images/default/pokemon_800.png',
    status: 'caught',
    typeIconPaths: ['/images/types/psychic.png'],
  }),
  row({
    id: 'smoke-lunala',
    pokemonId: 792,
    name: 'Lunala',
    imagePath: '/images/default/pokemon_792.png',
    status: 'caught',
    typeIconPaths: ['/images/types/psychic.png', '/images/types/ghost.png'],
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
    filterName: 'Trade',
    color: '#4bc574',
    tone: 'trade',
    rows: rowsWithStatus('trade'),
  },
  {
    key: 'system:caught',
    parent: 'caught',
    name: 'All Caught',
    filterName: 'Caught',
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
    filterName: 'Wanted',
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

const SMOKE_INSTANCES = Object.fromEntries(ROWS.map((entry) => [entry.id, {
  instance_id: entry.id,
  variant_id: `${String(entry.pokemonId).padStart(4, '0')}-default`,
  pokemon_id: entry.pokemonId,
  is_caught: entry.status !== 'wanted',
  is_for_trade: entry.status === 'trade',
  is_wanted: entry.status === 'wanted',
  favorite: entry.favorite,
  most_wanted: entry.mostWanted,
  caught_tags: entry.name.includes('Shadow') ? ['shadow-shinies'] : [],
  wanted_tags: [],
  registered: true,
  disabled: false,
  lucky: false,
  shadow: entry.name.includes('Shadow'),
  purified: false,
  nickname: null,
  cp: entry.cp,
  level: entry.status === 'wanted' ? null : 40,
  gender: entry.status === 'wanted' ? null : 'Male',
  weight: entry.status === 'wanted' ? null : 90.5,
  height: entry.status === 'wanted' ? null : 1.7,
  attack_iv: entry.status === 'wanted' ? null : 15,
  defense_iv: entry.status === 'wanted' ? null : 12,
  stamina_iv: entry.status === 'wanted' ? null : 13,
  fast_move_id: 101,
  charged_move1_id: 102,
  charged_move2_id: null,
  friendship_level: entry.status === 'wanted' ? 4 : null,
  pref_lucky: entry.status === 'wanted',
  location_card: null,
  location_caught: entry.status === 'wanted' ? null : 'Burnaby, British Columbia, Canada',
  date_caught: entry.status === 'wanted' ? null : '2026-08-24',
  mega: false,
  is_mega: false,
  crown: false,
  dynamax: entry.maxKind === 'dynamax',
  gigantamax: entry.maxKind === 'gigantamax',
  max_attack: entry.maxKind ? 1 : null,
  max_guard: entry.maxKind ? 0 : null,
  max_spirit: entry.maxKind ? 0 : null,
  is_fused: false,
} as unknown as PokemonInstance]));

export default function DeviceSmokeCollectionRoute() {
  const params = useLocalSearchParams<{ instance?: string | string[] }>();
  const initialInstanceId = Array.isArray(params.instance)
    ? params.instance[0]
    : params.instance;
  const initialRow = ROWS.find((entry) => entry.id === initialInstanceId) ?? null;
  const [openedContext, setOpenedContext] = useState<{
    row: NativeCollectionRow;
    orderedRows: NativeCollectionRow[];
  } | null>(() => initialRow ? {
    row: initialRow,
    orderedRows: rowsWithStatus(initialRow.status),
  } : null);
  const [catalogRows, setCatalogRows] = useState<NativeCollectionRow[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    if (!initialInstanceId) return;
    const requestedRow = ROWS.find((entry) => entry.id === initialInstanceId);
    if (!requestedRow) return;
    const update = setTimeout(() => {
      setOpenedContext({
        row: requestedRow,
        orderedRows: rowsWithStatus(requestedRow.status),
      });
    }, 0);
    return () => clearTimeout(update);
  }, [initialInstanceId]);

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

  const openedRow = openedContext?.row ?? null;
  const openedRows = openedContext?.orderedRows ?? [];
  const openedIndex = openedRow
    ? openedRows.findIndex((row) => row.id === openedRow.id)
    : -1;
  const previousRow = openedIndex > 0 ? openedRows[openedIndex - 1] : null;
  const nextRow = openedIndex >= 0 && openedIndex < openedRows.length - 1
    ? openedRows[openedIndex + 1]
    : null;
  const navigateWithinOverlay = (row: NativeCollectionRow) => {
    setOpenedContext((current) => ({
      row,
      orderedRows: current?.orderedRows ?? rowsWithStatus(row.status),
    }));
  };

  return (
    <>
      <NativeCollectionHubScreen
        assetBaseUrl={ASSET_BASE_URL}
        catalogRows={catalogRows}
        error={catalogError}
        inventoryTags={INVENTORY_TAGS}
        instances={SMOKE_INSTANCES}
        isLoading={catalogLoading}
        onActionMenuPress={() => undefined}
        onCreateTag={async () => undefined}
        onDeleteTag={async () => undefined}
        onOpenEntry={(row, orderedRows) => setOpenedContext({ row, orderedRows })}
        onOrganizePokemon={async () => ({
          message: 'Pokémon organized in the device fixture.',
        })}
        onRetry={() => undefined}
        onSaveTagOrder={async () => undefined}
        onUpdateTag={async () => undefined}
        wishlistTags={WISHLIST_TAGS}
      />
      {openedRow ? (
        <Modal
          animationType="slide"
          onRequestClose={() => setOpenedContext(null)}
          presentationStyle="fullScreen"
          statusBarTranslucent
          visible
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <NativeInstanceDetailScreen
            assetBaseUrl={ASSET_BASE_URL}
            cachedAt={null}
            detail={{
              instance: SMOKE_INSTANCES[openedRow.id],
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
                ? openedRow.pokemonId === 376
                  ? [
                      { label: 'Fast move', value: 'Bullet Punch' },
                      { label: 'Charged move', value: 'Meteor Mash' },
                    ]
                  : [
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
              moveOptions: openedRow.pokemonId === 376
                ? [
                    { id: 101, name: 'Bullet Punch', kind: 'fast', legacy: false, typeName: 'Steel' },
                    { id: 102, name: 'Meteor Mash', kind: 'charged', legacy: true, typeName: 'Steel' },
                    { id: 103, name: 'Psychic', kind: 'charged', legacy: false, typeName: 'Psychic' },
                  ]
                : [
                    { id: 101, name: 'Vine Whip', kind: 'fast', legacy: false, typeName: 'Grass' },
                    { id: 102, name: 'Frenzy Plant', kind: 'charged', legacy: true, typeName: 'Grass' },
                    { id: 103, name: 'Sludge Bomb', kind: 'charged', legacy: false, typeName: 'Poison' },
                  ],
              backgroundOptions: [{
                id: 9,
                name: 'Vancouver City Safari',
                imageUri: `${ASSET_BASE_URL}/images/backgrounds/bg_grass.png`,
              }],
              appearanceImageUris: {
                base: openedRow.imageUri,
                shadow: openedRow.imageUri,
                purified: openedRow.name.includes('Shiny')
                  ? `${ASSET_BASE_URL}/images/shiny/shiny_pokemon_${openedRow.pokemonId}.png`
                  : `${ASSET_BASE_URL}/images/pokemon/pokemon_${openedRow.pokemonId}.png`,
              },
              megaOptions: openedRow.pokemonId === 376
                ? [{
                    form: null,
                    imageUri: openedRow.imageUri,
                    label: 'Mega',
                    primal: false,
                  }]
                : [],
              fusionOptions: openedRow.pokemonId === 800
                ? [{
                    id: 2,
                    imageUri: `${ASSET_BASE_URL}/images/fusion/fusion_2.png`,
                    moveOptions: [{
                      id: 202,
                      name: 'Moongeist Beam',
                      kind: 'charged',
                      legacy: false,
                      typeName: 'Ghost',
                    }],
                    name: 'Dawn Wings Necrozma',
                    partnerPokemonId: 792,
                    partnerRows: ROWS.filter((candidate) => candidate.id === 'smoke-lunala'),
                  }]
                : [],
              crownOptions: openedRow.pokemonId === 888
                ? [{
                    form: 'Crowned Sword',
                    imageUri: `${ASSET_BASE_URL}/images/shiny/shiny_pokemon_888.png`,
                    label: 'Crowned Sword',
                  }]
                : [],
              sizeThresholds: {
                pokedex_height: 2,
                pokedex_weight: 100,
                height_standard_deviation: 0.2,
                weight_standard_deviation: 10,
                height_xxs_threshold: 1.4,
                height_xs_threshold: 1.7,
                height_xl_threshold: 2.3,
                height_xxl_threshold: 2.6,
                weight_xxs_threshold: 70,
                weight_xs_threshold: 85,
                weight_xl_threshold: 115,
                weight_xxl_threshold: 130,
              },
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
            onBack={() => setOpenedContext(null)}
            onEditInCurrentApp={() => undefined}
            onNext={openedRow.status !== 'wanted' && nextRow ? () => navigateWithinOverlay(nextRow) : undefined}
            onOpenTarget={(instanceId) => {
              const target = ROWS.find((row) => row.id === instanceId);
              if (target) setOpenedContext({ row: target, orderedRows: [target] });
            }}
            onPrevious={openedRow.status !== 'wanted' && previousRow ? () => navigateWithinOverlay(previousRow) : undefined}
            onRetry={() => undefined}
            onSaveDetails={async () => undefined}
            onToggleFavorite={() => undefined}
            saveError={null}
            saveNotice={null}
            />
          </GestureHandlerRootView>
        </Modal>
      ) : null}
    </>
  );
}
