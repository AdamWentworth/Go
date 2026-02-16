// FuseOverlay.tsx
import React from 'react';
import CaughtInstance from '../../CaughtInstance';
import './FuseOverlay.css';
import type { PokemonVariant } from '@/types/pokemonVariants'; // Adjust the path if needed

interface FuseOverlayProps {
  pokemon: PokemonVariant;
  onClose: () => void;
  onFuse?: () => void;
}

const FuseOverlay: React.FC<FuseOverlayProps> = ({ pokemon, onClose, onFuse }) => {
  const handleFuse = () => {
    console.log('Fuse button clicked for', pokemon);
    if (onFuse) onFuse();
  };

  return (
    <div className="fuse-overlay">
      <div className="overlay-content">
        <CaughtInstance pokemon={pokemon} isEditable={false} />
        <button onClick={handleFuse} className="fuse-button">Fuse</button>
        <button onClick={onClose} className="close-overlay">Close</button>
      </div>
    </div>
  );
};

export default FuseOverlay;
