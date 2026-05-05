import { generateUUID } from '@/utils/PokemonIDUtils';
import { buildTagItem } from '@/features/tags/utils/tagHelpers';
import { createScopedLogger } from '@/utils/logger';
import {
  asNumber,
  getPokemonIdFromMirrorVariant,
  normalizeMirrorVariantId,
  safeUpdateMirrorDetails,
  type OptionalMirrorUpdateDetailsFn,
} from './mirrorInstanceHelpers';

const log = createScopedLogger('createMirrorEntry');

type GenericMap = Record<string, unknown>;

type UpdateDetailsFn = OptionalMirrorUpdateDetailsFn<GenericMap>;

interface PokemonLike {
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

interface MirrorInstance extends GenericMap {
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

interface ListsLike {
  wanted?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Create a mirror "wanted" instance for this variant.
 * New model: instance_id is a UUID; variant_id stays canonical ("0001-suffix").
 */
export const createMirrorEntry = (
  pokemon: PokemonLike,
  instances: Record<string, GenericMap>,
  lists: ListsLike,
  updateDetails: UpdateDetailsFn = undefined,
): string => {
  const rawVariant = pokemon?.variant_id || pokemon?.instanceData?.variant_id || '';
  const variant_id = normalizeMirrorVariantId(String(rawVariant || '')) ?? '';

  if (!variant_id) {
    log.warn('Missing variant_id on pokemon:', pokemon);
  }

  const newId =
    typeof generateUUID === 'function'
      ? generateUUID()
      : typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

  const pokemon_id =
    asNumber(pokemon?.pokemon_id) ??
    asNumber(pokemon?.instanceData?.pokemon_id) ??
    getPokemonIdFromMirrorVariant(variant_id);

  const newInstance: MirrorInstance = {
    instance_id: newId,
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

  // 1) Update in-memory map for immediate UI.
  try {
    if (instances && typeof instances === 'object') {
      instances[newId] = newInstance;
    }
  } catch {
    // no-op
  }

  // 2) Update wanted bucket for immediate UI.
  try {
    if (lists?.wanted && typeof lists.wanted === 'object') {
      const variantForTag = {
        variant_id,
        pokemon_id,
        pokedex_number: pokemon_id,
        currentImage:
          pokemon?.currentImage ?? pokemon?.image_url ?? '/images/default_pokemon.png',
        name: pokemon?.species_name ?? pokemon?.name,
      };
      lists.wanted[newId] = buildTagItem(newId, newInstance, variantForTag);
    }
  } catch {
    // no-op
  }

  // 3) Persist new instance.
  safeUpdateMirrorDetails(updateDetails, newId, newInstance, (error) => {
    log.warn('safeUpdate failed:', error);
  });

  // 4) Mark source instance mirror flag if source id exists.
  const currentId = pokemon?.instanceData?.instance_id;
  if (currentId) {
    safeUpdateMirrorDetails(updateDetails, currentId, { mirror: true }, (error) => {
      log.warn('safeUpdate failed:', error);
    });
  }

  return newId;
};

export default createMirrorEntry;
