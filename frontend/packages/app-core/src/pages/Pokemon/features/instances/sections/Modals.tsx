import React from 'react';
import './Modals.css';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
import FuseOverlay from '../components/Caught/FuseOverlay';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { VariantBackground } from '@/types/pokemonSubTypes';

interface ModalsProps {
  showBackgrounds: boolean;
  setShowBackgrounds: React.Dispatch<React.SetStateAction<boolean>>;
  pokemon: {
    variantType?: PokemonVariant['variantType'];
    backgrounds?: VariantBackground[];
  };
  onSelectBackground: (background: VariantBackground | null) => void;
  overlayPokemon: PokemonVariant | Record<string, unknown> | null;
  onCloseOverlay: () => void;
  onFuse: () => void;
}

const Modals: React.FC<ModalsProps> = ({
  showBackgrounds,
  setShowBackgrounds,
  pokemon,
  onSelectBackground,
  overlayPokemon,
  onCloseOverlay,
  onFuse,
}) => {
  return (
    <>
      {showBackgrounds && (
        <div className="background-overlay" onClick={() => setShowBackgrounds(false)}>
          <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowBackgrounds(false)}>
              Close
            </button>
            <BackgroundLocationCard
              pokemon={pokemon}
              onSelectBackground={onSelectBackground}
            />
          </div>
        </div>
      )}

      {overlayPokemon && (
        <FuseOverlay
          pokemon={overlayPokemon as PokemonVariant}
          onClose={onCloseOverlay}
          onFuse={onFuse}
        />
      )}
    </>
  );
};

export default Modals;
