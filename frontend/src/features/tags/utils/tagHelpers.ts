// tagHelpers.ts

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant  } from '@/types/pokemonVariants';
import type { TagItem, TagBuckets } from '@/types/tags'; 

/* ------------------------------------------------------------------ */
/*  Build one item for the tag‑buckets                                */
/* ------------------------------------------------------------------ */
export function buildTagItem(
  key      : string,
  inst     : PokemonInstance,
  variant  : PokemonVariant,
): TagItem {
  return {
    /* visual data */
    currentImage : variant.currentImage ?? '/images/default_pokemon.png',
    type1_name   : variant.type1_name ?? 'Unknown',
    type2_name   : variant.type2_name ?? '',
    type_1_icon  : variant.type_1_icon ?? '',
    type_2_icon  : variant.type_2_icon ?? '',
    name         : variant.name,
    form         : variant.form,
    variantType  : variant.variantType,

    /* stats / misc */
    pokemon_id   : inst.pokemon_id,
    cp           : inst.cp,
    hp           : variant.stamina,
    shiny        : inst.shiny,
    shiny_rarity : variant.shiny_rarity,
    rarity       : variant.rarity,

    /* flags */
    favorite     : inst.favorite,
    mirror       : inst.mirror,
    pref_lucky   : inst.pref_lucky,
    registered   : inst.registered,
    gender       : inst.gender ?? 'Unknown',

    /* social / location */
    friendship_level : inst.friendship_level,
    location_card    : inst.location_card ?? '',

    /* metadata */
    pokedex_number   : variant.pokedex_number,
    date_available            : variant.date_available,
    date_shiny_available      : variant.date_shiny_available,
    date_shadow_available     : variant.date_shadow_available,
    date_shiny_shadow_available : variant.date_shiny_shadow_available,
    costumes      : variant.costumes,
    moves         : variant.moves,

    /* ids */
    key,
    instance_id   : inst.instance_id ?? '',
  };
}

/* ------------------------------------------------------------------ */
/*  Ensure an object has all four buckets                             */
/* ------------------------------------------------------------------ */
export function coerceToTagBuckets(
  obj: Record<string, Record<string, TagItem>>,
): TagBuckets {
  return {
    owned   : obj.owned   ?? {},
    trade   : obj.trade   ?? {},
    wanted  : obj.wanted  ?? {},
    unowned : obj.unowned ?? {},
    ...obj,                       // keep any future buckets
  };
}
