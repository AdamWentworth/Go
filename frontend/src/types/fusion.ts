// src/types/fusion.ts

import { Fusion } from './pokemonSubTypes';

export interface FusionSelectionData {
  baseKey: string;
  baseNumber: string;
  isShiny: boolean;
  fusionData: Fusion;
  leftCandidatesList: any[]; // Replace with the actual type if available
  rightCandidatesList: any[];
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  error?: string | null;
}
