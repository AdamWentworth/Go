// src/pages/Pokemon/features/fusion/core/getValidCandidates.ts
import { getAllInstances }           from '@/db/instancesDB';
import { initVariantsDB, VARIANTS_STORE } from '@/db/indexedDB';

import type { PokemonInstance }      from '@/types/pokemonInstance';
import { parseVariantId }            from '@/utils/PokemonIDUtils';
import type { PokemonVariant }       from '@/types/pokemonVariants';

export async function getValidCandidates(
  baseId: string,
  isShiny: boolean,
  ignoreShiny = false,
) {
  /* ----------------------------- instances ----------------------------- */
  const ownership =
    (await getAllInstances<PokemonInstance>()) ?? [];

  const filtered = ownership.filter((o) => {
    if (!o.instance_id?.startsWith(baseId.padStart(4, '0') + '-')) return false;
    if (!o.is_caught || o.is_for_trade || o.is_fused || o.disabled) return false;
    if (!ignoreShiny && (!!o.shiny) !== isShiny)                    return false;
    return true;
  });

  /* ------------------------------ variants ----------------------------- */
  const db = await initVariantsDB();
  const enriched: (PokemonVariant & { instanceData: PokemonInstance })[] = [];

  if (!db) return enriched; // IndexedDB unavailable (private-mode etc.)

  for (const cand of filtered) {
    const parsed = parseVariantId(cand.instance_id!);
    if (!parsed) continue;

    const variant = await db.get(
      VARIANTS_STORE,
      parsed.baseKey,
    ) as PokemonVariant | undefined;

    if (variant) enriched.push({ ...variant, instanceData: cand });
  }

  return enriched;
}
