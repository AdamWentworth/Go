import React from 'react';
import './ImageStage.css';

interface BackgroundRef {
  image_url: string;
}

interface ImageStageProps {
  level?: number;
  selectedBackground: BackgroundRef | null;
  isLucky: boolean;
  currentImage: string;
  name: string;
  dynamax: boolean;
  gigantamax: boolean;
  isPurified: boolean;
}

const ImageStage: React.FC<ImageStageProps> = ({
  selectedBackground,
  isLucky,
  currentImage,
  name,
  dynamax,
  gigantamax,
  isPurified,
}) => (
  <div className="image-container">
    {selectedBackground && (
      <div className="background-container">
        <div
          className="background-image"
          style={{ backgroundImage: `url(${selectedBackground.image_url})` }}
        />
        <div className="brightness-overlay" />
      </div>
    )}

    <div className="pokemon-image-container">
      {isLucky && (
        <img src="/images/lucky.png" alt="Lucky Backdrop" className="lucky-backdrop" />
      )}
      <img src={currentImage} alt={name} className="pokemon-image" />
      {dynamax && <img src="/images/dynamax.png" alt="Dynamax Badge" className="max-badge" />}
      {gigantamax && (
        <img src="/images/gigantamax.png" alt="Gigantamax Badge" className="max-badge" />
      )}
      {isPurified && (
        <img src="/images/purified.png" alt="Purified Badge" className="purified-badge" />
      )}
    </div>
  </div>
);

export default ImageStage;
