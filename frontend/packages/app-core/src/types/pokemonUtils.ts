// pokemonUtils.ts

export interface MegaData {
    isMega: boolean;
    megaForm?: string;
  }
  
export interface FusionState {
    is_fused?: boolean;
    fusion_form?: string;
  }

export interface CrownState {
    is_crown?: boolean;
    crown_form?: string;
  }
  
  export interface BaseStats {
    attack: number;
    defense: number;
    stamina: number;
  }
  
