import React from 'react';
import type { VariantBackground } from '@/types/pokemonSubTypes';

interface TradeImageStageProps {
  selectedBackground: VariantBackground | null;
  currentImage: string;
  name: string;
  dynamax: boolean;
  gigantamax: boolean;
}

const TradeImageStage: React.FC<TradeImageStageProps> = ({
  selectedBackground,
  currentImage,
  name,
  dynamax,
  gigantamax,
}) => (
  <div className="image-container">
    {selectedBackground && (
      <div className="background-container">
        <div
          className="background-image"
          style={{ backgroundImage: `url(${selectedBackground.image_url})` }}
        ></div>
        <div className="brightness-overlay"></div>
      </div>
    )}
    <div className="pokemon-image-container">
      <img src={currentImage} alt={name} className="pokemon-image" />
      {dynamax && (
        <img src={'/images/dynamax.png'} alt="Dynamax Badge" className="max-badge" />
      )}
      {gigantamax && (
        <img
          src={'/images/gigantamax.png'}
          alt="Gigantamax Badge"
          className="max-badge"
        />
      )}
    </div>
  </div>
);

export default TradeImageStage;

