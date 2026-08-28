import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type {
  CreateCustomTagRequest,
  CustomTagParent,
  PokemonTagOrderKey,
  UpdateCustomTagRequest,
} from '@pokemongonexus/shared-contracts/users';
import type {
  NativeCollectionRow,
  NativeTagSummary,
} from '../../features/collection/collectionModel';
import { buildNativeCatalogRows } from '../../features/collection/collectionModel';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NativeCollectionHubScreen } from '../../screens/NativeCollectionHubScreen';
import { NativeInstanceDetailScreen } from '../../screens/NativeInstanceDetailScreen';

const ASSET_BASE_URL = 'https://pokegonexus.com';
const CATALOG_FIXTURE_URL = Platform.OS === 'web'
  ? 'http://127.0.0.1:8092/pokemons.json'
  : 'http://10.0.2.2:8092/pokemons.json';

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

const combatStatsFor = (pokemonId: number) => {
  if (pokemonId === 3) return { attack: 198, defense: 189, stamina: 190 };
  if (pokemonId === 376) return { attack: 257, defense: 228, stamina: 190 };
  if (pokemonId === 800) return { attack: 251, defense: 195, stamina: 219 };
  if (pokemonId === 888) return { attack: 254, defense: 236, stamina: 192 };
  return { attack: 200, defense: 200, stamina: 200 };
};

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
  location_caught: entry.status === 'wanted' || entry.id === 'smoke-metagross'
    ? null
    : 'Burnaby, British Columbia, Canada',
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
  const params = useLocalSearchParams<{
    foreign?: string | string[];
    instance?: string | string[];
    tag?: string | string[];
  }>();
  const foreignParam = Array.isArray(params.foreign) ? params.foreign[0] : params.foreign;
  const tagParam = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const foreignMode = foreignParam === '1';
  const initialTagKey = tagParam === 'trade'
    ? 'system:trade'
    : tagParam === 'wanted'
      ? 'system:wanted'
      : foreignMode ? 'system:caught' : null;
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
  const [smokeInstances, setSmokeInstances] = useState(SMOKE_INSTANCES);
  const [inventoryTags, setInventoryTags] = useState(INVENTORY_TAGS);
  const [wishlistTags, setWishlistTags] = useState(WISHLIST_TAGS);
  const [nextTagId, setNextTagId] = useState(1);

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
  const updateTags = (
    parent: CustomTagParent,
    update: (current: NativeTagSummary[]) => NativeTagSummary[],
  ) => {
    if (parent === 'wanted') setWishlistTags(update);
    else setInventoryTags(update);
  };
  const createTag = async (request: CreateCustomTagRequest) => {
    const tagId = `created-${nextTagId}`;
    setNextTagId((current) => current + 1);
    updateTags(request.parent, (current) => [...current, {
      key: `custom:${tagId}`,
      parent: request.parent,
      name: request.name,
      color: request.color,
      tone: 'custom',
      rows: [],
    }]);
  };
  const deleteTag = async (tagId: string) => {
    const remove = (current: NativeTagSummary[]) => current.filter(
      (tag) => tag.key !== `custom:${tagId}`,
    );
    setInventoryTags(remove);
    setWishlistTags(remove);
  };
  const updateTag = async (tagId: string, request: UpdateCustomTagRequest) => {
    const replace = (current: NativeTagSummary[]) => current.map((tag) => (
      tag.key === `custom:${tagId}`
        ? {
            ...tag,
            name: request.name ?? tag.name,
            color: request.color ?? tag.color,
          }
        : tag
    ));
    setInventoryTags(replace);
    setWishlistTags(replace);
  };
  const saveTagOrder = async (
    parent: CustomTagParent,
    tagKeys: PokemonTagOrderKey[],
  ) => {
    updateTags(parent, (current) => {
      const byKey = new Map(current.map((tag) => [tag.key, tag]));
      return tagKeys.flatMap((key) => {
        const tag = byKey.get(key);
        return tag ? [tag] : [];
      });
    });
  };

  return (
    <>
      <NativeCollectionHubScreen
        assetBaseUrl={ASSET_BASE_URL}
        catalogOwner={foreignMode ? 'OtherTrainer' : null}
        catalogRows={foreignMode ? ROWS : catalogRows}
        error={catalogError}
        initialTagKey={initialTagKey}
        inventoryTags={inventoryTags}
        instances={smokeInstances}
        isLoading={catalogLoading}
        onActionMenuPress={() => undefined}
        onCreateTag={createTag}
        onDeleteTag={deleteTag}
        onOpenEntry={(row, orderedRows) => setOpenedContext({ row, orderedRows })}
        onOrganizePokemon={async () => ({
          message: 'Pokémon organized in the device fixture.',
        })}
        onRetry={() => undefined}
        onReturnToContext={foreignMode ? () => undefined : undefined}
        onSaveTagOrder={saveTagOrder}
        onUpdateTag={updateTag}
        requireTagSelection={foreignMode}
        wishlistTags={wishlistTags}
      />
      {openedRow ? (
        <Modal
          animationType="slide"
          onRequestClose={() => setOpenedContext(null)}
          presentationStyle="fullScreen"
          visible
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
              <NativeInstanceDetailScreen
            assetBaseUrl={ASSET_BASE_URL}
            cachedAt={null}
            canEdit={!foreignMode}
            detail={{
              instance: smokeInstances[openedRow.id],
              row: openedRow,
              baseStats: combatStatsFor(openedRow.pokemonId),
              targetRows: openedRow.status === 'wanted'
                ? rowsWithStatus('trade')
                : openedRow.status === 'trade'
                  ? rowsWithStatus('wanted')
                  : [],
              traits: openedRow.name.includes('Shiny') ? ['Shiny'] : [],
              stats: openedRow.status !== 'wanted'
                ? [{ label: 'Level', value: '40' }]
                : [],
              ivs: openedRow.status !== 'wanted'
                ? [
                    { label: 'Attack', value: 15 },
                    { label: 'Defense', value: 12 },
                    { label: 'HP', value: 13 },
                  ]
                : [],
              moves: openedRow.status !== 'wanted'
                ? openedRow.pokemonId === 376
                  ? [
                      { label: 'Fast move', value: 'Bullet Punch', typeName: 'Steel', typeIconUri: `${ASSET_BASE_URL}/images/types/steel.png`, raidPower: 9, pvpPower: 9 },
                      { label: 'Charged move', value: 'Meteor Mash', legacy: true, typeName: 'Steel', typeIconUri: `${ASSET_BASE_URL}/images/types/steel.png`, raidPower: 100, pvpPower: 100 },
                    ]
                  : [
                      { label: 'Fast move', value: 'Vine Whip', typeName: 'Grass', typeIconUri: `${ASSET_BASE_URL}/images/types/grass.png`, raidPower: 7, pvpPower: 5 },
                      { label: 'Charged move', value: 'Frenzy Plant', legacy: true, typeName: 'Grass', typeIconUri: `${ASSET_BASE_URL}/images/types/grass.png`, raidPower: 100, pvpPower: 100 },
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
                    { id: 101, name: 'Bullet Punch', kind: 'fast', legacy: false, typeName: 'Steel', typeIconUri: `${ASSET_BASE_URL}/images/types/steel.png`, raidPower: 9, pvpPower: 9 },
                    { id: 102, name: 'Meteor Mash', kind: 'charged', legacy: true, typeName: 'Steel', typeIconUri: `${ASSET_BASE_URL}/images/types/steel.png`, raidPower: 100, pvpPower: 100 },
                    { id: 103, name: 'Psychic', kind: 'charged', legacy: false, typeName: 'Psychic', typeIconUri: `${ASSET_BASE_URL}/images/types/psychic.png`, raidPower: 90, pvpPower: 75 },
                  ]
                : [
                    { id: 101, name: 'Vine Whip', kind: 'fast', legacy: false, typeName: 'Grass', typeIconUri: `${ASSET_BASE_URL}/images/types/grass.png`, raidPower: 7, pvpPower: 5 },
                    { id: 102, name: 'Frenzy Plant', kind: 'charged', legacy: true, typeName: 'Grass', typeIconUri: `${ASSET_BASE_URL}/images/types/grass.png`, raidPower: 100, pvpPower: 100 },
                    { id: 103, name: 'Sludge Bomb', kind: 'charged', legacy: false, typeName: 'Poison', typeIconUri: `${ASSET_BASE_URL}/images/types/poison.png`, raidPower: 80, pvpPower: 80 },
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
                    stats: { attack: 300, defense: 289, stamina: 190 },
                    typeIconUris: [
                      `${ASSET_BASE_URL}/images/types/steel.png`,
                      `${ASSET_BASE_URL}/images/types/dragon.png`,
                    ],
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
                    stats: { attack: 277, defense: 220, stamina: 200 },
                    typeIconUris: [
                      `${ASSET_BASE_URL}/images/types/psychic.png`,
                      `${ASSET_BASE_URL}/images/types/ghost.png`,
                    ],
                    partnerPokemonId: 792,
                    partnerRows: ROWS.filter((candidate) => candidate.id === 'smoke-lunala'),
                    backgroundOptions: [{
                      id: 501,
                      name: 'Fusion sky',
                      imageUri: `${ASSET_BASE_URL}/images/backgrounds/bg_psychic.png`,
                    }],
                    partnerBackgroundIds: { 'smoke-lunala': 502 },
                    comboBackgrounds: [{
                      ownBackgroundId: 501,
                      partnerBackgroundId: 502,
                      option: {
                        id: 503,
                        name: 'Combined fusion sky',
                        imageUri: `${ASSET_BASE_URL}/images/backgrounds/bg_ghost.png`,
                      },
                    }],
                  }]
                : [],
              crownOptions: openedRow.pokemonId === 888
                ? [{
                    form: 'Crowned Sword',
                    imageUri: `${ASSET_BASE_URL}/images/shiny/shiny_pokemon_888.png`,
                    label: 'Crowned Sword',
                    stats: { attack: 332, defense: 240, stamina: 192 },
                    typeIconUris: [
                      `${ASSET_BASE_URL}/images/types/fairy.png`,
                      `${ASSET_BASE_URL}/images/types/steel.png`,
                    ],
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
            onSaveDetails={async (patch) => {
              setSmokeInstances((current) => ({
                ...current,
                [openedRow.id]: { ...current[openedRow.id], ...patch },
              }));
            }}
            onToggleFavorite={() => undefined}
            saveError={null}
            saveNotice={null}
              />
            </SafeAreaView>
          </GestureHandlerRootView>
        </Modal>
      ) : null}
    </>
  );
}
