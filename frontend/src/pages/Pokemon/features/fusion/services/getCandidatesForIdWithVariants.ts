// src/pages/Pokemon/services/fusionSelection/services/getCandidatesForIdWithVariants.ts

import { getAllInstances, getVariantById } from '@/db/indexedDB';
import { parsePokemonKey } from '@/utils/PokemonIDUtils';
import type { PokemonInstance } from '@/types/pokemonInstance';

export async function getCandidatesForIdWithVariants(
  baseId: string,
  isShiny: boolean,
  ignoreShiny: boolean = false
) {
  const ownershipArray = await getAllInstances<PokemonInstance>();

  if (!ownershipArray || !Array.isArray(ownershipArray)) {
    throw new Error('[Fusion Handler] Invalid data from DB in getCandidatesForIdWithVariants');
  }

  const filtered = ownershipArray.filter((entry) => {
    if (!entry.instance_id?.startsWith(baseId.padStart(4, '0') + '-')) return false;
    if (!entry.is_caught || entry.is_for_trade || entry.is_fused || entry.disabled) return false;

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
    const candidateVariantKey = candidate.variant_id || parsedKey?.baseKey;
    if (!candidateVariantKey) continue;

    try {
      const variantData = await getVariantById(candidateVariantKey);
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
