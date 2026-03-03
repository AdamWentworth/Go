import React from 'react';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
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
    <div className="background-overlay" onClick={onClose}>
      <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          Close
        </button>
        <BackgroundLocationCard
          pokemon={pokemon}
          onSelectBackground={onSelectBackground}
        />
      </div>
    </div>
  );
};

export default TradeBackgroundModal;

