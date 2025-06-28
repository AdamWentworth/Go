// src/types/cp.ts

export interface BaseStats {
    attack: number;
    defense: number;
    stamina: number;
  }
  
  export interface IVs {
    Attack: number | '';
    Defense: number | '';
    Stamina: number | '';
  }
  
  export interface UseCalculatedCPProps {
    currentBaseStats: BaseStats;
    level: number | null;
    ivs: IVs;
    setCP: (cp: string) => void;
  }
  