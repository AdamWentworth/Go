export const pokemonContract = {
  endpoints: {
    pokemons: '/pokemons',
  },
} as const;

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

export type ShadowCostume = {
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

export interface BasePokemon {
  pokemon_id: number;
  name: string;
  pokedex_number: number;
  attack: number;
  defense: number;
  stamina: number;
  type_1_id: number;
  type_2_id: number;
  gender_rate: string;
  rarity: string;
  form: string | null;
  generation: number;
  available: number;
  shiny_available: number;
  shiny_rarity: string | null;
  date_available: string;
  date_shiny_available: string;
  female_unique: number;
  type1_name: string;
  type2_name: string;
  shadow_shiny_available: number;
  shadow_apex: string | null;
  date_shadow_available: string;
  date_shiny_shadow_available: string;
  shiny_shadow_rarity: string | null;
  image_url: string;
  image_url_shadow: string;
  image_url_shiny: string;
  image_url_shiny_shadow: string;
  type_1_icon: string;
  type_2_icon: string;
  female_data?: FemaleVariantData;
  costumes: Costume[];
  moves: Move[];
  fusion: Fusion[];
  backgrounds: VariantBackground[];
  cp40: number;
  cp50: number;
  evolves_to?: number[];
  evolves_from: number[];
  megaEvolutions: MegaEvolution[];
  raid_boss: RaidBoss[];
  sizes: {
    pokedex_height: number;
    pokedex_weight: number;
    height_standard_deviation: number;
    weight_standard_deviation: number;
    height_xxs_threshold: number;
    height_xs_threshold: number;
    height_xl_threshold: number;
    height_xxl_threshold: number;
    weight_xxs_threshold: number;
    weight_xs_threshold: number;
    weight_xl_threshold: number;
    weight_xxl_threshold: number;
  };
  max: MaxForm[];
  sprite_url: string | null;
}

export type Pokemons = BasePokemon[];
