// createNewInstanceData.ts

import { getKeyParts } from '@/utils/PokemonIDUtils';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant  } from '@/types/pokemonVariants';

/**
 * Factory that builds a brand‑new Pokémon *instance* object
 * (formerly called “ownership” entry).
 */
export function createNewInstanceData(variant: PokemonVariant): PokemonInstance {
  const keyParts       = getKeyParts(variant.pokemonKey);
  const matchedCostume = variant.costumes.find(c => c.name === keyParts.costumeName);
  const costumeId      = matchedCostume ? matchedCostume.costume_id : null;

  return {
    pokemon_id: variant.pokemon_id,
    nickname   : null,
    cp         : null,
    attack_iv  : null,
    defense_iv : null,
    stamina_iv : null,
    shiny      : keyParts.isShiny,
    costume_id : costumeId,
    lucky      : false,
    shadow     : keyParts.isShadow,
    purified   : false,
    fast_move_id     : null,
    charged_move1_id : null,
    charged_move2_id : null,
    weight     : null,
    height     : null,
    gender     : null,
    mirror     : false,
    pref_lucky : false,
    registered : false,
    favorite   : false,
    location_card   : null,
    location_caught : null,
    friendship_level: null,
    date_caught : null,
    date_added  : new Date().toISOString(),
    last_update : Date.now(),

    /* instance‑status flags */
    is_unowned   : true,
    is_owned     : false,
    is_for_trade : false,
    is_wanted    : false,

    /* trading meta */
    not_trade_list  : {},
    not_wanted_list : {},
    trade_filters   : {},
    wanted_filters  : {},

    /* misc */
    gps        : null,
    mega       : false,
    mega_form  : null,
    is_mega    : false,
    level      : null,
    fusion     : {},
    is_fused   : null,
    fusion_form: null,
    dynamax    : null,
    gigantamax : null,
    max_attack : null,
    max_guard  : null,
    max_spirit : null,
  };
}
