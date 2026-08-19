import React from 'react';

import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
import CloseButton from '@/components/CloseButton';
import OverlayPortal from '@/components/OverlayPortal';
import type { PokemonVariant } from '@/types/pokemonVariants';

export type BackgroundSelection = {
  background_id: number;
  image_url: string;
  name: string;
  location: string;
  date: string;
  costume_id?: number;
};

interface VariantSearchBackgroundOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentPokemonData: PokemonVariant | undefined;
  onSelectBackground: (background: BackgroundSelection | null) => void;
  selectedCostumeId: number | undefined;
}

const VariantSearchBackgroundOverlay: React.FC<VariantSearchBackgroundOverlayProps> = ({
  isOpen,
  onClose,
  currentPokemonData,
  onSelectBackground,
  selectedCostumeId,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <OverlayPortal onClose={onClose} closeOnBackdrop>
      <div className="background-overlay" onClick={onClose}>
      <div className="background-overlay-content" onClick={(event) => event.stopPropagation()}>
        <BackgroundLocationCard
          pokemon={currentPokemonData ?? {}}
          onSelectBackground={onSelectBackground}
          selectedCostumeId={selectedCostumeId}
        />
      </div>
      <CloseButton
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      />
      </div>
    </OverlayPortal>
  );
};

export default VariantSearchBackgroundOverlay;
