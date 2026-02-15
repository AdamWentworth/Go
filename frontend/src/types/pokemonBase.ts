// PokemonBase.ts
import type { Costume, MegaEvolution, Fusion, MaxForm, RaidBoss, FemaleVariantData, VariantBackground, Move } from './pokemonSubTypes';

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
