// src/types/pokemonSubTypes.ts

export interface Costume {
  costume_id: number;
  date_available: string;
  date_shiny_available: string | null;
  image_url?: string;
  image_url_female?: string;
  image_url_shiny?: string;
  image_url_shiny_female?: string | null;
  name: string;
  shadow_costume?: ShadowCostume | null;
  shiny_available: boolean | number;
}

type ShadowCostume = {
  date_available: string;
  date_shiny_available: string;
  image_url_shadow_costume?: string;
  image_url_female_shadow_costume?: string;
  image_url_shiny_shadow_costume?: string;
  image_url_female_shiny_shadow_costume?: string;
};

export interface MegaEvolution {
  attack?: number;
  cp40?: number;
  cp50?: number;
  date_available: string;
  defense?: number;
  form?: string | null;
  id: number;
  image_url?: string;
  image_url_shiny?: string;
  mega_energy_cost: number;
  primal?: boolean | null;
  sprite_url?: string | null;
  stamina?: number;
  type1_name: string;
  type2_name?: string;
  type_1_id: number;
  type_2_id?: number;
  variantType?: string;
  female_data?: FemaleVariantData;
  costumes?: Costume[];
}

export interface Fusion {
  date_available: string;
  base_pokemon_id1: number;
  base_pokemon_id2: number;
  attack?: number;
  defense?: number;
  stamina?: number;
  type_1_id: number;
  type_2_id?: number;
  type1_name: string;
  type2_name: string;
  image_url?: string;
  image_url_shiny?: string;
  name: string;
  fusion_id?: number | null;
}

export interface MaxForm {
  pokemon_id: number;
  dynamax: boolean | number;
  gigantamax: boolean | number;
  dynamax_release_date: string | null;
  gigantamax_release_date: string | null;
  gigantamax_image_url?: string | null;
  shiny_gigantamax_image_url?: string | null;
}


export interface FemaleVariantData {
  pokemon_id: number;
  image_url: string;
  shadow_image_url: string;
  shiny_image_url: string;
  shiny_shadow_image_url: string;
}

export interface VariantBackground {
  background_id: number;
  image_url: string;
  name: string;
  costume_id: number;
  date: string;
  location: string;
}

export interface RaidBoss {
  id: number;
  pokemon_id: number;
  name: string;
  form: string;
  type: string;
  boosted_weather: string;
  max_boosted_cp: number;
  max_unboosted_cp: number;
  min_boosted_cp: number;
  min_unboosted_cp: number;
  possible_shiny: number;
  tier: string;
}

export interface Move {
  move_id: number;
  name: string;
  type_id: number;
  raid_power: number;
  pvp_power: number;
  raid_energy: number;
  pvp_energy: number;
  raid_cooldown: number;
  pvp_turns: number;
  is_fast: number;
  type_name: string;
  legacy: boolean;
  fusion_id?: number | null; 
  shadow?: number | null;
  purified?: number | null;
  apex?: number | null;
  type: string;
}
