// src/pages/Pokemon/components/Overlays/FusionPokemonModal.tsx

import React from 'react';
import FusionPokemonSelection from './FusionPokemonSelection';
import { PokemonVariant } from '@/types/pokemonVariants';
import { Fusion } from '@/types/pokemonSubTypes';

type FusionPokemonModalProps = {
  isOpen: boolean;
  fusionSelectionData: {
    leftCandidatesList: PokemonVariant[];
    rightCandidatesList: PokemonVariant[];
    fusionData: Fusion;
    error?: string;
    [key: string]: any; // includes resolve, reject, baseKey, etc.
  } | null;

  onConfirm: (choice: string, leftId: string, rightId: string) => void;
  onCancel: () => void;
  onCreateNewLeft: () => void;
  onCreateNewRight: () => void;
};

const FusionPokemonModal: React.FC<FusionPokemonModalProps> = ({
  isOpen,
  fusionSelectionData,
  onConfirm,
  onCancel,
  onCreateNewLeft,
  onCreateNewRight,
}) => {
  if (!isOpen || !fusionSelectionData) return null;

  return (
    <FusionPokemonSelection
      {...fusionSelectionData}
      leftCandidatesList={fusionSelectionData.leftCandidatesList}
      rightCandidatesList={fusionSelectionData.rightCandidatesList}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onCreateNewLeft={onCreateNewLeft}
      onCreateNewRight={onCreateNewRight}
    />
  );
};

export default FusionPokemonModal;
