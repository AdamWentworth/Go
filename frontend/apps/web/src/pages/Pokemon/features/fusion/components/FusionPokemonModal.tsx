// src/pages/Pokemon/components/Overlays/FusionPokemonModal.tsx

import React from 'react';
import FusionPokemonSelection from './FusionPokemonSelection';
import type { FusionSelectionData } from '@/types/fusion';

type FusionPokemonModalProps = {
  isOpen: boolean;
  fusionSelectionData: FusionSelectionData | null;

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
      error={fusionSelectionData.error ?? undefined}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onCreateNewLeft={onCreateNewLeft}
      onCreateNewRight={onCreateNewRight}
    />
  );
};

export default FusionPokemonModal;
