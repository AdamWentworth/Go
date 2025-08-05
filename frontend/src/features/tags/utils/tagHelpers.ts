// src/features/tags/utils/tagHelpers.ts
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant  } from '@/types/pokemonVariants';
import type { TagItem, TagBuckets } from '@/types/tags';

export function buildTagItem(
  key: string,
  inst: PokemonInstance,
  variant: PokemonVariant,
): TagItem {
  return {
    currentImage : variant.currentImage ?? '/images/default_pokemon.png',
    type1_name   : variant.type1_name ?? 'Unknown',
    type2_name   : variant.type2_name ?? '',
    type_1_icon  : variant.type_1_icon ?? '',
    type_2_icon  : variant.type_2_icon ?? '',
    name         : variant.name,
    form         : variant.form,
    variantType  : variant.variantType,

    pokemon_id   : inst.pokemon_id,
    cp           : inst.cp,
    hp           : variant.stamina,
    shiny        : inst.shiny,
    shiny_rarity : variant.shiny_rarity,
    rarity       : variant.rarity,

    favorite     : inst.favorite,
    mirror       : inst.mirror,
    pref_lucky   : inst.pref_lucky,
    registered   : inst.registered,
    gender       : inst.gender ?? 'Unknown',

    friendship_level : inst.friendship_level,
    location_card    : inst.location_card ?? '',

    pokedex_number   : variant.pokedex_number,
    date_available            : variant.date_available,
    date_shiny_available      : variant.date_shiny_available,
    date_shadow_available     : variant.date_shadow_available,
    date_shiny_shadow_available : variant.date_shiny_shadow_available,
    costumes      : variant.costumes,
    moves         : variant.moves,

    key,
    instance_id   : inst.instance_id ?? '',
  };
}

export function coerceToTagBuckets(
  obj: Record<string, Record<string, TagItem>>,
): TagBuckets {
  return {
    caught  : obj.caught  ?? {},
    trade   : obj.trade   ?? {},
    wanted  : obj.wanted  ?? {},
    missing : obj.missing ?? {},
    ...obj,
  };
}
