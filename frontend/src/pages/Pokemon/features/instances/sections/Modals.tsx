import React from 'react';
import './Modals.css';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
import FuseOverlay from '../components/Caught/FuseOverlay';

interface ModalsProps {
  showBackgrounds: boolean;
  setShowBackgrounds: React.Dispatch<React.SetStateAction<boolean>>;
  pokemon: Record<string, unknown>;
  onSelectBackground: (background: unknown) => void;
  overlayPokemon: Record<string, unknown> | null;
  onCloseOverlay: () => void;
  onFuse: (...args: unknown[]) => void;
}

const Modals: React.FC<ModalsProps> = ({
  showBackgrounds,
  setShowBackgrounds,
  pokemon,
  onSelectBackground,
  overlayPokemon,
  onCloseOverlay,
  onFuse,
}) => (
  <>
    {showBackgrounds && (
      <div className="background-overlay" onClick={() => setShowBackgrounds(false)}>
        <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={() => setShowBackgrounds(false)}>
            Close
          </button>
          <BackgroundLocationCard
            pokemon={pokemon as never}
            onSelectBackground={onSelectBackground as never}
          />
        </div>
      </div>
    )}

    {overlayPokemon && (
      <FuseOverlay
        pokemon={overlayPokemon as never}
        onClose={onCloseOverlay}
        onFuse={onFuse as never}
      />
    )}
  </>
);

export default Modals;
