// src/pages/Pokemon/features/instances/utils/createMirrorEntry.js

import { generateUUID } from "@/utils/PokemonIDUtils";
import { buildTagItem } from "@/features/tags/utils/tagHelpers";

/** best-effort number coercion */
const asNumber = (n) => {
  if (n == null) return undefined;
  const x = Number(n);
  return Number.isFinite(x) ? x : undefined;
};

/** Normalize legacy variant-id differences (see MirrorManager). */
function normalizeVariantId(v) {
  if (!v || typeof v !== 'string') return v;
  const i = v.indexOf('-');
  if (i < 0) return v.toLowerCase();
  const prefix = v.slice(0, i);
  const suffix = v.slice(i + 1).replace(/-/g, '_');
  return `${prefix}-${suffix}`.toLowerCase();
}

/** try to read pokemon_id from variant_id like "0001-default" */
const pokemonIdFromVariant = (variantId) => {
  if (typeof variantId !== "string") return undefined;
  const m = variantId.match(/^(\d{1,4})/);
  return m ? asNumber(m[1]) : undefined;
};

/** call updateDetails in a way that supports both signatures:
 *   - updateDetails(id, data)
 *   - updateDetails({ [id]: data })
 */
const safeUpdate = (updateDetails, id, data) => {
  try {
    if (typeof updateDetails !== "function") return;
    if (updateDetails.length >= 2) {
      updateDetails(id, data);
    } else {
      updateDetails({ [id]: data });
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[createMirrorEntry] safeUpdate failed:", e);
    }
  }
};

/**
 * Create a mirror "wanted" instance for this variant.
 * NEW MODEL: instance_id is a UUID (no base prefix), variant_id stays as "0001-<suffix>".
 */
export const createMirrorEntry = (pokemon, ownershipData, lists, updateDetails) => {
  const rawVariant = (pokemon?.variant_id || pokemon?.instanceData?.variant_id || "");
  const variant_id = normalizeVariantId(String(rawVariant || ""));
  if (!variant_id) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[createMirrorEntry] Missing variant_id on pokemon:", pokemon);
    }
  }

  // new instance id is a UUID
  const newId = (typeof generateUUID === "function")
    ? generateUUID()
    : (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)));

  // resolve pokemon_id (prefer explicit, else derive from variant_id)
  const pokemon_id =
    asNumber(pokemon?.pokemon_id) ??
    asNumber(pokemon?.instanceData?.pokemon_id) ??
    pokemonIdFromVariant(variant_id);

  // Build minimal instance row for the mirror entry
  const newInstance = {
    instance_id : newId,
    variant_id  : variant_id || undefined,
    pokemon_id,
    is_owned    : false,
    is_for_trade: false,
    is_wanted   : true,
    mirror      : true,
    is_unowned  : false,
    pref_lucky  : false,
    friendship_level: null,
    date_added  : new Date().toISOString(),
    last_update : Date.now(),
    shiny       : !!(pokemon?.instanceData?.shiny),
    favorite    : false,
    most_wanted : false,
    registered  : true, // wanted entries are considered registered for tags logic
  };

  // 1) Update in-memory map for immediate UI
  try {
    if (ownershipData && typeof ownershipData === "object") {
      ownershipData[newId] = newInstance;
    }
  } catch {}

  // 2) Update tags (wanted bucket) for immediate UI
  try {
    if (lists && lists.wanted && typeof lists.wanted === "object") {
      const variantForTag = {
        ...pokemon,
        variant_id,
        currentImage: pokemon?.currentImage ?? pokemon?.image_url ?? "/images/default_pokemon.png",
        name: pokemon?.species_name ?? pokemon?.name,
      };
      lists.wanted[newId] = buildTagItem(newId, newInstance, variantForTag);
    }
  } catch {}

  // 3) Persist new instance
  safeUpdate(updateDetails, newId, newInstance);

  // 4) Also mark the current instance as "mirror: true" (if we know its instance_id)
  const currentId = pokemon?.instanceData?.instance_id;
  if (currentId) {
    safeUpdate(updateDetails, currentId, { mirror: true });
  }

  return newId;
};

export default createMirrorEntry;
