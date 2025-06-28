// core/getValidCandidates.ts
import { getAllFromDB, getFromDB } from '@/db/indexedDB';
import type { PokemonInstance } from '@/types/pokemonInstance';
import { parsePokemonKey } from '@/utils/PokemonIDUtils';
import type { PokemonVariant } from '@/types/pokemonVariants';

export async function getValidCandidates(baseId: string, isShiny: boolean, ignoreShiny = false) {
  const ownership = await getAllFromDB('pokemonOwnership') as PokemonInstance[] || [];

  const filtered = ownership.filter(o => {
    if (!o.instance_id?.startsWith(baseId.padStart(4, '0') + '-')) return false;
    if (!o.is_owned || o.is_for_trade || o.is_fused || o.disabled) return false;
    if (!ignoreShiny && (!!o.shiny) !== isShiny) return false;
    return true;
  });

  const enriched: (PokemonVariant & { instanceData: PokemonInstance })[] = [];

  for (const cand of filtered) {
    const parsed = parsePokemonKey(cand.instance_id!);
    if (!parsed) continue;
    const v = await getFromDB('pokemonVariants', parsed.baseKey) as PokemonVariant | undefined;
    if (v) enriched.push({ ...v, instanceData: cand });
  }

  return enriched;
}
