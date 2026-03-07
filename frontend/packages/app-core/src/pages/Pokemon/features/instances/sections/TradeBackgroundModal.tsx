import React from 'react';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
import CloseButton from '@/components/CloseButton';
import OverlayPortal from '@/components/OverlayPortal';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { VariantBackground } from '@/types/pokemonSubTypes';

type BackgroundOption = VariantBackground;

type TradePokemon = PokemonVariant & {
  instanceData: PokemonInstance;
  backgrounds: BackgroundOption[];
  max: unknown[];
};

interface TradeBackgroundModalProps {
  showBackgrounds: boolean;
  pokemon: TradePokemon;
  onClose: () => void;
  onSelectBackground: (background: BackgroundOption | null) => void;
}

const TradeBackgroundModal: React.FC<TradeBackgroundModalProps> = ({
  showBackgrounds,
  pokemon,
  onClose,
  onSelectBackground,
}) => {
  if (!showBackgrounds) {
    return null;
  }

  return (
    <OverlayPortal>
      <div className="background-overlay" onClick={onClose}>
        <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
          <BackgroundLocationCard
            pokemon={pokemon}
            onSelectBackground={onSelectBackground}
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

export default TradeBackgroundModal;
