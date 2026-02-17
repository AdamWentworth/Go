import React from 'react';

import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
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
    <div className="background-overlay" onClick={onClose}>
      <div className="background-overlay-content" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="close-button" onClick={onClose}>
          Close
        </button>
        <BackgroundLocationCard
          pokemon={currentPokemonData ?? {}}
          onSelectBackground={onSelectBackground}
          selectedCostumeId={selectedCostumeId}
        />
      </div>
    </div>
  );
};

export default VariantSearchBackgroundOverlay;

