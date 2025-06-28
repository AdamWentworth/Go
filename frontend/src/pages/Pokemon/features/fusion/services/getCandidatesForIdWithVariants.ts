// src/pages/Pokemon/services/fusionSelection/services/getCandidatesForIdWithVariants.ts

import { getAllFromDB, getFromDB } from '@/db/indexedDB';
import { parsePokemonKey } from '@/utils/PokemonIDUtils';
import { PokemonInstance } from '@/types/pokemonInstance';

export async function getCandidatesForIdWithVariants(
  baseId: string,
  isShiny: boolean,
  ignoreShiny: boolean = false
) {
  const ownershipArray = await getAllFromDB('pokemonOwnership') as PokemonInstance[];

  if (!ownershipArray || !Array.isArray(ownershipArray)) {
    throw new Error('[Fusion Handler] Invalid data from DB in getCandidatesForIdWithVariants');
  }

  const filtered = ownershipArray.filter((entry) => {
    if (!entry.instance_id?.startsWith(baseId.padStart(4, '0') + '-')) return false;
    if (!entry.is_owned || entry.is_for_trade || entry.is_fused || entry.disabled) return false;

    if (!ignoreShiny) {
      const entryIsShiny = !!entry.shiny;
      if (entryIsShiny !== isShiny) return false;
    }

    return true;
  });

  const enrichedCandidates = [];

  for (const candidate of filtered) {
    const { instance_id } = candidate;
    if (!instance_id) continue;

    const parsedKey = parsePokemonKey(instance_id);
    if (!parsedKey) {
      console.warn(`[Fusion Handler] Could not parse instance_id: ${instance_id}`);
      continue;
    }

    const candidateVariantKey = parsedKey.baseKey;

    try {
      const variantData = await getFromDB('pokemonVariants', candidateVariantKey);
      if (!variantData) {
        console.warn(`[Fusion Handler] No variant data found for ${candidateVariantKey}`);
        continue;
      }

      enrichedCandidates.push({
        ...variantData,
        instanceData: candidate,
      });
    } catch (err) {
      console.error(`[Fusion Handler] Error fetching variantData for ${candidateVariantKey}:`, err);
    }
  }

  return enrichedCandidates;
}
