type BooleanMap = Record<string, boolean>;

export interface LocalPokemonRef {
  currentImage?: string;
}

export interface TradeTargetEntry {
  pokemon_id?: number;
  name?: string;
  species_name?: string;
  pokedex_number?: number;
  currentImage?: string;
  image_url?: string;
  image_url_shiny?: string;
  pref_lucky?: boolean;
  variantType?: string;
  form?: string | null;
  [key: string]: unknown;
}

export interface TradeTargetDisplayItem extends TradeTargetEntry {
  key: string;
  species_name: string;
}

export interface TradeTargetLists {
  wanted?: Record<string, TradeTargetEntry>;
}

export const filterVisibleTradeTargetEntries = (
  entries: Array<[string, TradeTargetEntry]>,
  notWantedMap: BooleanMap,
  editMode: boolean,
  isMirror: boolean,
  mirrorKey: string | null,
): Array<[string, TradeTargetEntry]> =>
  entries.filter(([key]) => {
    const isVisible = editMode || !notWantedMap[key];
    const mirrorMatch = !isMirror || key === mirrorKey;
    return isVisible && mirrorMatch;
  });

export const toTradeTargetDisplayItems = (
  entries: Array<[string, TradeTargetEntry]>,
  fallbackImage?: string,
): TradeTargetDisplayItem[] =>
  entries.map(([key, details]) => ({
    ...details,
    key,
    pokemon_id: details?.pokemon_id,
    name: details?.name,
    species_name: details?.species_name ?? details?.name ?? '',
    pokedex_number: details?.pokedex_number,
    currentImage: details?.currentImage || fallbackImage,
    image_url: details?.currentImage || fallbackImage,
    image_url_shiny: details?.image_url_shiny || details?.currentImage || fallbackImage,
  }));

export const resolveTradeTargetContainerClass = (
  isMirror: boolean,
  itemCount: number,
): string => {
  if (isMirror) return 'single-item-list';
  if (itemCount > 30) return 'xxlarge-list';
  if (itemCount > 15) return 'xlarge-list';
  if (itemCount > 9) return 'large-list';
  return '';
};

export const resolveTradeTargetDisplayName = (
  wantedPokemon: TradeTargetDisplayItem,
): string =>
  `${wantedPokemon.form ? `${wantedPokemon.form} ` : ''}${
    wantedPokemon.name ?? wantedPokemon.species_name ?? 'Pokemon'
  }`;

export const resolveTradeTargetPokedexLabel = (
  wantedPokemon: TradeTargetDisplayItem,
): string | null =>
  typeof wantedPokemon.pokedex_number === 'number'
    ? `#${String(wantedPokemon.pokedex_number).padStart(3, '0')}`
    : null;
