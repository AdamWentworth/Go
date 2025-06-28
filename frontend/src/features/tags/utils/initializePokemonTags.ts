// initializePokemonTags.ts

import { parsePokemonKey }      from '@/utils/PokemonIDUtils';
import { determineImageUrl }    from '@/utils/imageHelpers';
import { buildTagItem }         from '@/features/tags/utils/tagHelpers';

import type { Instances }   from '@/types/instances';
import type { TagBuckets }      from '@/types/tags';
import type { PokemonVariant }  from '@/types/pokemonVariants';

export const emptyTagBuckets = {
  owned: {}, trade: {}, wanted: {}, unowned: {},
} as const;

function freshBuckets(): TagBuckets {
  return { owned: {}, trade: {}, wanted: {}, unowned: {} };
}

/* -------------------------------------------------------------------------- */
/*  Build a complete set of tag‑buckets                                       */
/* -------------------------------------------------------------------------- */
export function initializePokemonTags(
  instances: Instances,
  variants : PokemonVariant[],
): TagBuckets {
  const tags = freshBuckets();   

  /* 🔍  O(1) lookup instead of O(n²) scans */
  const variantMap = new Map(variants.map(v => [v.pokemonKey, v]));

  const missing = new Set<string>();+

  Object.entries(instances).forEach(([key, inst]) => {
    const baseKey = parsePokemonKey(key).baseKey;
    const variant = variantMap.get(baseKey);
    if (!variant) {
      missing.add(baseKey);
      return;
    }

    /* pick correct image -------------------------------------------------- */
    let img: string | undefined = variant.currentImage;
    const {
      gender, is_mega, mega_form,
      is_fused, fusion_form, purified,
    } = inst;

    if (
      (gender === 'Female' && variant.female_data) ||
      (is_mega && variant.megaEvolutions)          ||
      (is_fused && variant.fusion)                 ||
      purified
    ) {
      img = determineImageUrl(
        gender === 'Female',
        variant,
        is_mega,
        mega_form ?? undefined,
        is_fused ?? undefined,
        fusion_form ?? undefined,
        purified ?? false,          // <-- cast away the null → type‑error fixed
      );
    }

    /* build item & bucket‑ise -------------------------------------------- */
    const item = buildTagItem(key, inst, { ...variant, currentImage: img });

    if (inst.is_unowned  ) tags.unowned[key] = item;
    if (inst.is_owned    ) tags.owned  [key] = item;
    if (inst.is_for_trade) tags.trade  [key] = item;
    if (inst.is_wanted   ) tags.wanted [key] = item;
  });

  if (process.env.NODE_ENV === 'development' && missing.size) {
    console.warn('[initializePokemonTags] missing variants:', [...missing]);
  }
  return tags;
}

/* -------------------------------------------------------------------------- */
/*  One‑shot updater (optional)                                               */
/* -------------------------------------------------------------------------- */
export function updatePokemonTags(
  instances: Instances,
  variants : PokemonVariant[],
  cb       : (tags: TagBuckets) => void,
): void {
  cb(initializePokemonTags(instances, variants));
}
