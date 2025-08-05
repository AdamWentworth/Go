// src/features/tags/utils/initializePokemonTags.ts
import { determineImageUrl } from '@/utils/imageHelpers';
import { buildTagItem } from '@/features/tags/utils/tagHelpers';

import type { Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { PokemonVariant } from '@/types/pokemonVariants';

export const emptyTagBuckets = {
  caught: {}, trade: {}, wanted: {}, missing: {},
} as const;

function freshBuckets(): TagBuckets {
  return { caught: {}, trade: {}, wanted: {}, missing: {} };
}

function pad4(n: number): string {
  return String(n).padStart(4, '0');
}

export function initializePokemonTags(
  instances: Instances,
  variants: PokemonVariant[],
): TagBuckets {
  const tags = freshBuckets();

  const byKey = new Map<string, PokemonVariant>();
  const byPidShiny = new Map<string, PokemonVariant>();
  for (const v of variants) {
    byKey.set(v.pokemonKey, v);
    const shinyFlag = v.variantType?.includes('shiny') ? 1 : 0;
    const pid = String(v.pokemon_id);
    const k = `${pid}|${shinyFlag}`;
    if (!byPidShiny.has(k)) byPidShiny.set(k, v);
  }

  const missing = new Set<string>();

  Object.entries(instances).forEach(([instanceId, inst]) => {
    let variantKey = inst.variant_id ?? '';
    if (!variantKey) {
      const guess = `${pad4(inst.pokemon_id)}-${inst.shiny ? 'shiny' : 'default'}`;
      if (byKey.has(guess)) variantKey = guess;
      else {
        const alt = byPidShiny.get(`${inst.pokemon_id}|${inst.shiny ? 1 : 0}`);
        if (alt) variantKey = alt.pokemonKey;
      }
    }

    const variant = variantKey ? byKey.get(variantKey) : undefined;
    if (!variant) {
      missing.add(variantKey || `(pid:${inst.pokemon_id} shiny:${!!inst.shiny})`);
      return;
    }

    let img: string | undefined = variant.currentImage;
    const {
      gender, is_mega, mega_form,
      is_fused, fusion_form, purified,
    } = inst as any;

    if (
      (gender === 'Female' && variant.female_data) ||
      (is_mega && variant.megaEvolutions) ||
      (is_fused && variant.fusion) ||
      purified
    ) {
      img = determineImageUrl(
        gender === 'Female',
        variant,
        is_mega as boolean | undefined,
        (mega_form ?? undefined) as string | undefined,
        (is_fused ?? undefined) as boolean | undefined,
        (fusion_form ?? undefined) as string | undefined,
        !!purified,
      );
    }

    const item = buildTagItem(instanceId, inst, { ...variant, currentImage: img });

    if (!inst.registered) tags.missing[instanceId]   = item;
    if (inst.is_caught)   tags.caught [instanceId]   = item;
    if (inst.is_for_trade)tags.trade  [instanceId]   = item;
    if (inst.is_wanted)   tags.wanted [instanceId]   = item;
  });

  if (process.env.NODE_ENV === 'development' && missing.size) {
    console.warn('[initializePokemonTags] missing variants:', [...missing]);
  }
  return tags;
}

export function updatePokemonTags(
  instances: Instances,
  variants: PokemonVariant[],
  cb: (tags: TagBuckets) => void,
): void {
  cb(initializePokemonTags(instances, variants));
}
