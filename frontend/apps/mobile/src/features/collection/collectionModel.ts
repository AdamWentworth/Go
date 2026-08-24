import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type {
  BasePokemon,
  PokemonMovesChunk,
} from '@pokemongonexus/shared-contracts/pokemon';
import type {
  CustomTagParent,
  CustomTagsEnvelope,
  PokemonTagOrderKey,
} from '@pokemongonexus/shared-contracts/users';
import { buildPokemonCatalogEntries } from '@pokemongonexus/shared-domain/catalog';
import { resolveInstanceCollectionKey } from '@pokemongonexus/shared-domain/instances';

export type NativeCollectionFilter =
  | 'all'
  | 'caught'
  | 'trade'
  | 'wanted'
  | 'favorites'
  | 'most-wanted';

export type NativeCollectionRow = {
  id: string;
  pokemonId: number;
  pokedexNumber: number;
  name: string;
  imageUri: string | null;
  locationBackgroundUri: string | null;
  maxKind: 'dynamax' | 'gigantamax' | null;
  purified: boolean;
  lucky: boolean;
  typeIconUris: string[];
  status: 'caught' | 'trade' | 'wanted';
  source?: 'catalog' | 'instance';
  cp: number | null;
  favorite: boolean;
  mostWanted: boolean;
};

export type NativeTagSummary = {
  key: PokemonTagOrderKey;
  parent: CustomTagParent;
  name: string;
  color: string;
  tone: 'caught' | 'trade' | 'favorites' | 'wanted' | 'most-wanted' | 'custom';
  rows: NativeCollectionRow[];
};

export type NativeCollectionSort = 'number' | 'name' | 'cp' | 'favorite';
export type NativeCollectionSortDirection = 'ascending' | 'descending';

export type NativeInstanceDetail = {
  row: NativeCollectionRow;
  traits: string[];
  stats: { label: string; value: string }[];
  ivs: { label: string; value: number }[];
  moves: { label: string; value: string }[];
  provenance: { label: string; value: string }[];
  preferences: { label: string; value: string }[];
};

const firstString = (...values: (string | null | undefined)[]): string | null =>
  values.find((value): value is string => Boolean(value?.trim())) ?? null;

const selectCostumeImage = (
  instance: PokemonInstance,
  pokemon: BasePokemon,
): string | null => {
  if (instance.costume_id == null) return null;
  const costume = pokemon.costumes?.find(
    (entry) => entry.costume_id === instance.costume_id,
  );
  if (!costume) return null;
  const isFemale = instance.gender?.toLowerCase() === 'female';

  if (instance.shadow && costume.shadow_costume) {
    return instance.shiny
      ? firstString(
        isFemale
          ? costume.shadow_costume.image_url_female_shiny_shadow_costume
          : null,
        costume.shadow_costume.image_url_shiny_shadow_costume,
      )
      : firstString(
        isFemale ? costume.shadow_costume.image_url_female_shadow_costume : null,
        costume.shadow_costume.image_url_shadow_costume,
      );
  }

  return instance.shiny
    ? firstString(
      isFemale ? costume.image_url_shiny_female : null,
      costume.image_url_shiny,
    )
    : firstString(isFemale ? costume.image_url_female : null, costume.image_url);
};

export const resolveNativeInstanceImage = (
  instance: PokemonInstance,
  pokemon: BasePokemon,
): string | null => {
  if (instance.gigantamax) {
    const maxForm = pokemon.max?.find((entry) => Boolean(entry.gigantamax));
    return firstString(
      instance.shiny ? maxForm?.shiny_gigantamax_image_url : null,
      maxForm?.gigantamax_image_url,
      instance.shiny ? pokemon.image_url_shiny : null,
      pokemon.image_url,
    );
  }

  if (instance.is_mega || instance.mega) {
    const mega = activeMega(instance, pokemon);
    return firstString(
      instance.shiny ? mega?.image_url_shiny : null,
      mega?.image_url,
      pokemon.image_url,
    );
  }

  if (instance.is_fused) {
    const fusion = activeFusion(instance, pokemon);
    return firstString(
      instance.shiny ? fusion?.image_url_shiny : null,
      fusion?.image_url,
      pokemon.image_url,
    );
  }

  if (instance.crown) {
    const crown = activeCrown(instance, pokemon);
    return firstString(
      instance.shiny ? crown?.image_url_shiny : null,
      crown?.image_url,
      pokemon.image_url,
    );
  }

  const costumeImage = selectCostumeImage(instance, pokemon);
  if (costumeImage) return costumeImage;

  const isFemale = instance.gender?.toLowerCase() === 'female';
  const female = isFemale ? pokemon.female_data : null;
  if (instance.shadow) {
    return firstString(
      instance.shiny ? female?.shiny_shadow_image_url : null,
      instance.shiny ? pokemon.image_url_shiny_shadow : null,
      female?.shadow_image_url,
      pokemon.image_url_shadow,
      pokemon.image_url,
    );
  }
  return firstString(
    instance.shiny ? female?.shiny_image_url : null,
    instance.shiny ? pokemon.image_url_shiny : null,
    female?.image_url,
    pokemon.image_url,
  );
};

const statusForInstance = (
  instance: PokemonInstance,
): NativeCollectionRow['status'] | null => {
  if (instance.is_wanted) return 'wanted';
  if (instance.is_for_trade) return 'trade';
  if (instance.is_caught) return 'caught';
  return null;
};

const normalizeFormToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const formatVariantLabel = (value: string): string =>
  value
    .trim()
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ');

function activeFusion(instance: PokemonInstance, pokemon: BasePokemon) {
  if (!instance.is_fused) return undefined;
  const normalizedForm = normalizeFormToken(instance.fusion_form);
  if (normalizedForm) {
    return pokemon.fusion?.find(
      (entry) => normalizeFormToken(entry.name) === normalizedForm,
    ) ?? pokemon.fusion?.[0];
  }
  const storedId = Number(instance.fusion?.fusion_id ?? instance.fusion?.id);
  return pokemon.fusion?.find((entry) => entry.fusion_id === storedId) ?? pokemon.fusion?.[0];
}

function activeMega(instance: PokemonInstance, pokemon: BasePokemon) {
  if (!instance.is_mega && !instance.mega) return undefined;
  const normalizedForm = normalizeFormToken(instance.mega_form);
  return pokemon.megaEvolutions?.find(
    (entry) => normalizeFormToken(entry.form) === normalizedForm,
  ) ?? pokemon.megaEvolutions?.[0];
}

function activeCrown(instance: PokemonInstance, pokemon: BasePokemon) {
  if (!instance.crown) return undefined;
  const normalizedForm = normalizeFormToken(instance.fusion_form);
  return pokemon.crownForms?.find((entry) =>
    normalizeFormToken(entry.display_form) === normalizedForm ||
    normalizeFormToken(entry.form) === normalizedForm,
  ) ?? pokemon.crownForms?.[0];
}

const displayName = (instance: PokemonInstance, pokemon: BasePokemon): string => {
  if (instance.nickname?.trim()) return instance.nickname.trim();

  const fusion = activeFusion(instance, pokemon);
  if (fusion) return `${instance.shiny ? 'Shiny ' : ''}${fusion.name}`;

  const crown = activeCrown(instance, pokemon);
  if (crown) {
    const label = crown.display_form?.trim() || crown.form?.trim();
    return `${instance.shiny ? 'Shiny ' : ''}${label ? `${label} ` : ''}${pokemon.name}`;
  }

  const mega = activeMega(instance, pokemon);
  if (mega) {
    const kind = mega.primal ? 'Primal' : 'Mega';
    const suffix = mega.form?.trim() ? ` ${mega.form.trim()}` : '';
    return `${instance.shiny ? 'Shiny ' : ''}${kind} ${pokemon.name}${suffix}`;
  }

  const costume = instance.costume_id == null
    ? undefined
    : pokemon.costumes?.find((entry) => entry.costume_id === instance.costume_id);
  const traits = [
    instance.shiny ? 'Shiny' : null,
    instance.shadow ? 'Shadow' : null,
    instance.gigantamax ? 'Gigantamax' : null,
    !instance.gigantamax && instance.dynamax ? 'Dynamax' : null,
    costume?.name ? formatVariantLabel(costume.name) : null,
  ].filter(Boolean);
  return [...traits, pokemon.name].join(' ');
};

const resolveTypeIcons = (
  instance: PokemonInstance,
  pokemon: BasePokemon,
): string[] => {
  const fusion = activeFusion(instance, pokemon);
  const crown = activeCrown(instance, pokemon);
  const mega = activeMega(instance, pokemon);
  const variantTypes = fusion
    ? [fusion.type1_name, fusion.type2_name]
    : crown
      ? [crown.type1_name, crown.type2_name]
      : mega
        ? [mega.type1_name, mega.type2_name]
        : null;
  if (!variantTypes) return [pokemon.type_1_icon, pokemon.type_2_icon].filter(Boolean);
  return variantTypes
    .filter((type): type is string => Boolean(type?.trim()))
    .map((type) => `/images/types/${type.trim().toLowerCase()}.png`);
};

const absoluteImageUri = (image: string | null, assetOrigin: string): string | null => {
  if (!image) return null;
  try {
    return new URL(image, assetOrigin).toString();
  } catch {
    return null;
  }
};

const resolveLocationBackgroundImage = (
  instance: PokemonInstance,
  pokemon: BasePokemon,
): string | null => {
  if (instance.location_card == null || instance.location_card === '') return null;
  const backgroundId = Number(instance.location_card);
  if (!Number.isFinite(backgroundId)) return null;
  const candidates = pokemon.backgrounds?.filter(
    (background) => Number(background.background_id) === backgroundId,
  ) ?? [];
  if (candidates.length === 0) return null;

  const exactCostume = candidates.find(
    (background) => Number(background.costume_id ?? 0) === Number(instance.costume_id ?? 0),
  );
  const generic = candidates.find((background) => background.costume_id == null);
  return (exactCostume ?? generic ?? candidates[0])?.image_url ?? null;
};

export const buildNativeCollectionRows = (
  instances: Record<string, PokemonInstance>,
  catalog: BasePokemon[],
  assetOrigin: string,
): NativeCollectionRow[] => {
  const pokemonById = new Map(catalog.map((pokemon) => [pokemon.pokemon_id, pokemon]));

  return Object.entries(instances)
    .flatMap(([key, instance]) => {
      if (instance.disabled) return [];
      const status = statusForInstance(instance);
      const pokemon = pokemonById.get(instance.pokemon_id);
      if (!status || !pokemon) return [];
      const typeIconUris = resolveTypeIcons(instance, pokemon)
        .map((icon) => absoluteImageUri(icon, assetOrigin))
        .filter((icon): icon is string => Boolean(icon));
      return [{
        id: instance.instance_id ?? key,
        pokemonId: instance.pokemon_id,
        pokedexNumber: pokemon.pokedex_number,
        name: displayName(instance, pokemon),
        imageUri: absoluteImageUri(resolveNativeInstanceImage(instance, pokemon), assetOrigin),
        locationBackgroundUri: absoluteImageUri(
          resolveLocationBackgroundImage(instance, pokemon),
          assetOrigin,
        ),
        maxKind: instance.gigantamax
          ? 'gigantamax'
          : instance.dynamax
            ? 'dynamax'
            : null,
        purified: instance.purified,
        lucky: instance.lucky || (
          status === 'wanted' && instance.pref_lucky
        ),
        typeIconUris,
        status,
        source: 'instance',
        cp: instance.cp,
        favorite: instance.favorite,
        mostWanted: instance.most_wanted,
      } satisfies NativeCollectionRow];
    })
    .sort((left, right) =>
      left.pokedexNumber - right.pokedexNumber || left.name.localeCompare(right.name),
    );
};

export const buildNativeCatalogRows = (
  catalog: BasePokemon[],
  assetOrigin: string,
): NativeCollectionRow[] => buildPokemonCatalogEntries(catalog).map((entry) => ({
  id: entry.id,
  pokemonId: entry.pokemonId,
  pokedexNumber: entry.pokedexNumber,
  name: entry.name,
  imageUri: absoluteImageUri(entry.imageUri, assetOrigin),
  locationBackgroundUri: null,
  maxKind: entry.maxKind,
  purified: false,
  lucky: false,
  typeIconUris: entry.typeIconUris
    .map((icon) => absoluteImageUri(icon, assetOrigin))
    .filter((icon): icon is string => Boolean(icon)),
  status: 'caught',
  source: 'catalog',
  cp: null,
  favorite: false,
  mostWanted: false,
}));

const DEFAULT_TAG_ORDER: Record<CustomTagParent, PokemonTagOrderKey[]> = {
  caught: ['system:caught', 'system:favorites', 'system:trade'],
  wanted: ['system:wanted', 'system:most-wanted'],
};

const SYSTEM_TAGS: Record<string, Omit<NativeTagSummary, 'rows'>> = {
  'system:caught': {
    key: 'system:caught',
    parent: 'caught',
    name: 'All Caught',
    color: '#5798ff',
    tone: 'caught',
  },
  'system:favorites': {
    key: 'system:favorites',
    parent: 'caught',
    name: 'Favorites',
    color: '#ffd45a',
    tone: 'favorites',
  },
  'system:trade': {
    key: 'system:trade',
    parent: 'caught',
    name: 'For Trade',
    color: '#4bc574',
    tone: 'trade',
  },
  'system:wanted': {
    key: 'system:wanted',
    parent: 'wanted',
    name: 'All Wanted',
    color: '#ef5b72',
    tone: 'wanted',
  },
  'system:most-wanted': {
    key: 'system:most-wanted',
    parent: 'wanted',
    name: 'Most Wanted',
    color: '#ff704d',
    tone: 'most-wanted',
  },
};

const rowsForSystemTag = (
  key: PokemonTagOrderKey,
  rows: NativeCollectionRow[],
): NativeCollectionRow[] => {
  switch (key) {
    case 'system:caught':
      return rows.filter((row) => row.status === 'caught' || row.status === 'trade');
    case 'system:favorites':
      return rows.filter((row) => row.favorite);
    case 'system:trade':
      return rows.filter((row) => row.status === 'trade');
    case 'system:wanted':
      return rows.filter((row) => row.status === 'wanted');
    case 'system:most-wanted':
      return rows.filter((row) => row.status === 'wanted' && row.mostWanted);
    default:
      return [];
  }
};

export const buildNativeTagSummaries = (
  rows: NativeCollectionRow[],
  instances: Record<string, PokemonInstance>,
  envelope: CustomTagsEnvelope,
  parent: CustomTagParent,
): NativeTagSummary[] => {
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const customDefinitions = envelope.tags.filter((tag) => tag.parent === parent);
  const customKeys = customDefinitions.map(
    (tag) => `custom:${tag.tag_id}` as PokemonTagOrderKey,
  );
  const allowed = new Set([...DEFAULT_TAG_ORDER[parent], ...customKeys]);
  const orderedKeys = [
    ...(envelope.orders?.[parent] ?? []),
    ...DEFAULT_TAG_ORDER[parent],
    ...customKeys,
  ].filter((key, index, all) => allowed.has(key) && all.indexOf(key) === index);

  return orderedKeys.flatMap((key) => {
    const system = SYSTEM_TAGS[key];
    if (system && system.parent === parent) {
      return [{ ...system, rows: rowsForSystemTag(key, rows) }];
    }
    if (!key.startsWith('custom:')) return [];
    const tagId = key.slice('custom:'.length);
    const definition = customDefinitions.find((tag) => tag.tag_id === tagId);
    if (!definition) return [];
    const tagRows = Object.entries(instances).flatMap(([instanceKey, instance]) => {
      const memberships = parent === 'caught' ? instance.caught_tags : instance.wanted_tags;
      if (!memberships?.includes(tagId)) return [];
      const row = rowById.get(instance.instance_id ?? instanceKey);
      return row ? [row] : [];
    });
    return [{
      key,
      parent,
      name: definition.name,
      color: definition.color,
      tone: 'custom',
      rows: tagRows,
    } satisfies NativeTagSummary];
  });
};

export const filterNativeCollectionRows = (
  rows: NativeCollectionRow[],
  filter: NativeCollectionFilter,
  query: string,
): NativeCollectionRow[] => {
  const normalizedQuery = query.trim().toLowerCase();
  return rows.filter((row) =>
    (filter === 'all' ||
      row.status === filter ||
      (filter === 'favorites' && row.favorite) ||
      (filter === 'most-wanted' && row.status === 'wanted' && row.mostWanted)) &&
    (!normalizedQuery ||
      row.name.toLowerCase().includes(normalizedQuery) ||
      String(row.pokedexNumber).includes(normalizedQuery)),
  );
};

const compareNullableNumber = (
  left: number | null,
  right: number | null,
): number => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
};

export const sortNativeCollectionRows = (
  rows: NativeCollectionRow[],
  sort: NativeCollectionSort,
  direction: NativeCollectionSortDirection,
): NativeCollectionRow[] => {
  const multiplier = direction === 'ascending' ? 1 : -1;
  return [...rows].sort((left, right) => {
    let comparison = 0;
    if (sort === 'name') comparison = left.name.localeCompare(right.name);
    if (sort === 'cp') {
      const nullableComparison = compareNullableNumber(left.cp, right.cp);
      if (left.cp == null || right.cp == null) return nullableComparison;
      comparison = nullableComparison;
    }
    if (sort === 'favorite') comparison = Number(left.favorite) - Number(right.favorite);
    if (sort === 'number') comparison = left.pokedexNumber - right.pokedexNumber;

    if (comparison !== 0) return comparison * multiplier;
    return left.pokedexNumber - right.pokedexNumber || left.name.localeCompare(right.name);
  });
};

const formatNumber = (value: number): string =>
  Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);

const findMoveName = (
  moves: PokemonMovesChunk,
  pokemonId: number,
  moveId: number | null,
): string | null => {
  if (moveId == null) return null;
  const entry = moves.find((candidate) => candidate.pokemon_id === pokemonId);
  if (!entry) return null;
  const pool = [
    ...entry.moves,
    ...entry.fusion.flatMap((fusion) => fusion.moves ?? []),
    ...entry.crownForms.flatMap((crown) => crown.moves ?? []),
  ];
  return pool.find((move) => move.move_id === moveId)?.name ?? `Move #${moveId}`;
};

const compactRows = <T>(rows: (T | null)[]): T[] =>
  rows.filter((row): row is T => row !== null);

export const buildNativeInstanceDetail = (
  instances: Record<string, PokemonInstance>,
  catalog: BasePokemon[],
  moves: PokemonMovesChunk,
  requestedInstanceId: string,
  assetOrigin: string,
): NativeInstanceDetail | null => {
  const collectionKey = resolveInstanceCollectionKey(instances, requestedInstanceId);
  if (!collectionKey) return null;
  const instance = instances[collectionKey];
  const pokemon = catalog.find((entry) => entry.pokemon_id === instance.pokemon_id);
  if (!pokemon) return null;
  const row = buildNativeCollectionRows(
    { [collectionKey]: instance },
    [pokemon],
    assetOrigin,
  )[0];
  if (!row) return null;

  const traits = compactRows([
    instance.shiny ? 'Shiny' : null,
    instance.shadow ? 'Shadow' : null,
    instance.purified ? 'Purified' : null,
    instance.lucky ? 'Lucky' : null,
    instance.dynamax ? 'Dynamax' : null,
    instance.gigantamax ? 'Gigantamax' : null,
    instance.is_mega || instance.mega ? 'Mega Evolved' : null,
    instance.is_fused ? 'Fused' : null,
    instance.crown ? 'Crowned' : null,
    instance.is_traded ? 'Previously traded' : null,
  ]);

  const stats = compactRows([
    instance.cp == null ? null : { label: 'CP', value: instance.cp.toLocaleString() },
    instance.level == null ? null : { label: 'Level', value: formatNumber(instance.level) },
    instance.gender ? { label: 'Gender', value: instance.gender } : null,
    instance.weight == null ? null : { label: 'Weight', value: `${formatNumber(instance.weight)} kg` },
    instance.height == null ? null : { label: 'Height', value: `${formatNumber(instance.height)} m` },
  ]);

  const ivs = compactRows([
    instance.attack_iv == null ? null : { label: 'Attack', value: instance.attack_iv },
    instance.defense_iv == null ? null : { label: 'Defense', value: instance.defense_iv },
    instance.stamina_iv == null ? null : { label: 'HP', value: instance.stamina_iv },
  ]);

  const moveRows = compactRows([
    instance.fast_move_id == null ? null : {
      label: 'Fast move',
      value: findMoveName(moves, instance.pokemon_id, instance.fast_move_id) ?? 'Unknown',
    },
    instance.charged_move1_id == null ? null : {
      label: 'Charged move',
      value: findMoveName(moves, instance.pokemon_id, instance.charged_move1_id) ?? 'Unknown',
    },
    instance.charged_move2_id == null ? null : {
      label: 'Second charged move',
      value: findMoveName(moves, instance.pokemon_id, instance.charged_move2_id) ?? 'Unknown',
    },
  ]);

  const provenance = compactRows([
    instance.location_caught ? { label: 'Caught near', value: instance.location_caught } : null,
    instance.date_caught ? {
      label: 'Caught on',
      value: new Date(instance.date_caught).toLocaleDateString(),
    } : null,
    instance.original_trainer_name ? {
      label: 'Original trainer',
      value: instance.original_trainer_name,
    } : null,
  ]);

  const preferences = compactRows([
    instance.friendship_level == null ? null : {
      label: 'Friendship',
      value: `${instance.friendship_level}/5 hearts`,
    },
    instance.pref_lucky ? { label: 'Lucky trade', value: 'Requested' } : null,
    instance.mirror ? { label: 'Mirror trade', value: 'Required' } : null,
  ]);

  return { row, traits, stats, ivs, moves: moveRows, provenance, preferences };
};
