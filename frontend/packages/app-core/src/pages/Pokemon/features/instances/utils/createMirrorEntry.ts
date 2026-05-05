import { generateUUID } from '@/utils/PokemonIDUtils';
import { createScopedLogger } from '@/utils/logger';
import {
  asNumber,
  getPokemonIdFromMirrorVariant,
  normalizeMirrorVariantId,
} from './mirrorInstanceHelpers';
import type { PokemonInstance } from '@/types/pokemonInstance';

const log = createScopedLogger('createMirrorEntry');

type GenericMap = Record<string, unknown>;

export interface MirrorSourcePokemon {
  variant_id?: string;
  pokemon_id?: number | string;
  species_name?: string;
  name?: string;
  currentImage?: string;
  image_url?: string;
  instanceData?: {
    instance_id?: string;
    variant_id?: string;
    pokemon_id?: number | string;
    shiny?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface MirrorInstance extends Partial<PokemonInstance>, GenericMap {
  instance_id: string;
  variant_id?: string;
  pokemon_id?: number;
  is_caught: boolean;
  is_for_trade: boolean;
  is_wanted: boolean;
  mirror: boolean;
  pref_lucky: boolean;
  friendship_level: null;
  date_added: string;
  last_update: number;
  shiny: boolean;
  favorite: boolean;
  most_wanted: boolean;
  registered: boolean;
}

const makeMirrorInstanceId = (): string =>
  typeof generateUUID === 'function'
    ? generateUUID()
    : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export const buildMirrorInstance = (
  pokemon: MirrorSourcePokemon,
  instanceId: string = makeMirrorInstanceId(),
): MirrorInstance => {
  const rawVariant = pokemon?.variant_id || pokemon?.instanceData?.variant_id || '';
  const variant_id = normalizeMirrorVariantId(String(rawVariant || '')) ?? '';

  if (!variant_id) {
    log.warn('Missing variant_id on pokemon:', pokemon);
  }

  const pokemon_id =
    asNumber(pokemon?.pokemon_id) ??
    asNumber(pokemon?.instanceData?.pokemon_id) ??
    getPokemonIdFromMirrorVariant(variant_id);

  const newInstance: MirrorInstance = {
    instance_id: instanceId,
    variant_id: variant_id || undefined,
    pokemon_id,
    is_caught: false,
    is_for_trade: false,
    is_wanted: true,
    mirror: true,
    pref_lucky: false,
    friendship_level: null,
    date_added: new Date().toISOString(),
    last_update: Date.now(),
    shiny: !!pokemon?.instanceData?.shiny,
    favorite: false,
    most_wanted: false,
    registered: true,
  };

  return newInstance;
};

/**
 * Build a mirror "wanted" instance for this variant.
 * The caller owns persistence; this helper intentionally does not mutate store
 * shaped objects or write to IndexedDB.
 */
export const createMirrorEntry = buildMirrorInstance;

export default createMirrorEntry;
