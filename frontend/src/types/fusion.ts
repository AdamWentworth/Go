// src/types/fusion.ts

import { Fusion } from './pokemonSubTypes';
import type { PokemonVariant } from './pokemonVariants';

export interface FusionSelectionData {
  baseKey: string;
  baseNumber: string;
  isShiny: boolean;
  fusionData: Fusion;
  leftCandidatesList: PokemonVariant[];
  rightCandidatesList: PokemonVariant[];
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
  error?: string | null;
}
