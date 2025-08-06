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
    type1_name   : (variant as any).type1_name ?? 'Unknown',
    type2_name   : (variant as any).type2_name ?? '',
    type_1_icon  : (variant as any).type_1_icon ?? '',
    type_2_icon  : (variant as any).type_2_icon ?? '',
    name         : (variant as any).name,
    form         : (variant as any).form,
    variantType  : (variant as any).variantType,

    pokemon_id   : inst.pokemon_id,
    cp           : inst.cp,
    hp           : (variant as any).stamina,
    shiny        : inst.shiny,
    shiny_rarity : (variant as any).shiny_rarity,
    rarity       : (variant as any).rarity,

    favorite     : inst.favorite,
    mirror       : (inst as any).mirror,
    pref_lucky   : (inst as any).pref_lucky,
    registered   : inst.registered,
    gender       : inst.gender ?? 'Unknown',

    friendship_level : (inst as any).friendship_level,
    location_card    : inst.location_card ?? '',

    pokedex_number   : (variant as any).pokedex_number,
    date_available   : (variant as any).date_available,
    date_shiny_available      : (variant as any).date_shiny_available,
    date_shadow_available     : (variant as any).date_shadow_available,
    date_shiny_shadow_available : (variant as any).date_shiny_shadow_available,
    costumes      : (variant as any).costumes,
    moves         : (variant as any).moves,

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
