import React from 'react';

import HighlightActionButton from './Menus/PokemonMenu/HighlightActionButton';
import FusionPokemonModal from '../features/fusion/components/FusionPokemonModal';
import MegaPokemonModal from '../features/mega/components/MegaPokemonModal';
import type { MegaSelectionData } from '../features/mega/hooks/useMegaPokemonHandler';
import type { FusionSelectionData } from '@/types/fusion';
import type { InstanceStatus } from '@/types/instances';

type PokemonPageOverlaysProps = {
  isEditable: boolean;
  highlightedCards: Set<string>;
  onConfirmChangeTags: (filter: InstanceStatus) => Promise<void>;
  activeStatusFilter: InstanceStatus | null;
  isUpdating: boolean;
  isMegaSelectionOpen: boolean;
  megaSelectionData: MegaSelectionData | null;
  onMegaResolve: (option: string) => void;
  onMegaReject: (reason?: unknown) => void;
  isFusionSelectionOpen: boolean;
  fusionSelectionData: FusionSelectionData | null;
  onFusionResolve: (choice: string, leftInstanceId: string, rightInstanceId: string) => void;
  onFusionCancel: () => void;
  onCreateNewLeft: () => void;
  onCreateNewRight: () => void;
};

const PokemonPageOverlays: React.FC<PokemonPageOverlaysProps> = ({
  isEditable,
  highlightedCards,
  onConfirmChangeTags,
  activeStatusFilter,
  isUpdating,
  isMegaSelectionOpen,
  megaSelectionData,
  onMegaResolve,
  onMegaReject,
  isFusionSelectionOpen,
  fusionSelectionData,
  onFusionResolve,
  onFusionCancel,
  onCreateNewLeft,
  onCreateNewRight,
}) => (
  <>
    {isEditable && highlightedCards.size > 0 && (
      <HighlightActionButton
        highlightedCards={highlightedCards}
        handleConfirmChangeTags={onConfirmChangeTags}
        tagFilter={activeStatusFilter ?? ''}
        isUpdating={isUpdating}
      />
    )}

    <MegaPokemonModal
      open={isMegaSelectionOpen}
      data={megaSelectionData}
      onResolve={onMegaResolve}
      onReject={onMegaReject}
    />

    {isFusionSelectionOpen && fusionSelectionData && (
      <FusionPokemonModal
        isOpen={isFusionSelectionOpen}
        fusionSelectionData={fusionSelectionData}
        onConfirm={onFusionResolve}
        onCancel={onFusionCancel}
        onCreateNewLeft={onCreateNewLeft}
        onCreateNewRight={onCreateNewRight}
      />
    )}
  </>
);

export default PokemonPageOverlays;
