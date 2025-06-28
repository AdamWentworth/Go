// src/types/pokemonVariants.ts
import type { BasePokemon } from './pokemonBase';
import type { PokemonInstance } from './pokemonInstance';

export type VariantKind =
  | 'default'
  | 'shiny'
  | 'shadow'
  | 'shiny_shadow'
  | 'primal'
  | 'shiny_primal'
  | 'dynamax'
  | 'shiny_dynamax'
  | 'gigantamax'
  | 'shiny_gigantamax'
  | `costume_${string}`
  | `costume_${string}_shiny`
  | `shadow_costume_${string}`
  | `mega${string}`
  | `shiny_mega${string}`
  | `fusion_${string}`
  | `shiny_fusion_${string}`;

export interface VariantCommon {
  variantType: VariantKind;
  currentImage: string | undefined;
  species_name: string;
  primal?: boolean;
  megaForm?: string;
  fusion_id?: number | null;
  instanceData?: PokemonInstance;
}

// Omit base fields that get transformed in variants
export type PokemonVariant = Omit<BasePokemon, 
  'variantType' | 'currentImage' | 'pokemonKey'
> & VariantCommon & {
  // Additional variant-only properties
  raid_boss?: BasePokemon['raid_boss'];
  backgrounds?: BasePokemon['backgrounds'];
  pokemonKey: string;
};

export type AllVariants = PokemonVariant[];