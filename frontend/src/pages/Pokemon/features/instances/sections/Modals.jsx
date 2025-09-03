// sections/Modals.jsx
import React from 'react';
import './Modals.css';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
import FuseOverlay from '../components/Owned/FuseOverlay';

const Modals = ({
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
          <button className="close-button" onClick={() => setShowBackgrounds(false)}>Close</button>
          <BackgroundLocationCard
            pokemon={pokemon}
            onSelectBackground={onSelectBackground}
          />
        </div>
      </div>
    )}

    {overlayPokemon && (
      <FuseOverlay
        pokemon={overlayPokemon}
        onClose={onCloseOverlay}
        onFuse={onFuse}
      />
    )}
  </>
);

export default Modals;