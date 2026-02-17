// BackgroundLocationCard.tsx

import React, { useState, useEffect } from 'react';
import './BackgroundLocationCard.css';
import type { VariantBackground } from '@/types/pokemonSubTypes';

type Props = {
  pokemon?: {
    variantType?: string;
    backgrounds?: VariantBackground[];
  };
  onSelectBackground?: (background: VariantBackground | null) => void;
  selectedCostumeId?: number;
  filterBackground?: (background: VariantBackground) => boolean;
  title?: string;
  containerClassName?: string;
  itemClassName?: string;
  selectedItemClassName?: string;
};

const BackgroundLocationCard: React.FC<Props> = ({
  pokemon,
  onSelectBackground,
  selectedCostumeId,
  filterBackground,
  title = 'Select Background',
  containerClassName = 'background-location-card',
  itemClassName = 'background-item',
  selectedItemClassName = 'selected',
}) => {
  const [selectedBackground, setSelectedBackground] = useState<VariantBackground | null>(null);

  useEffect(() => {
    setSelectedBackground(null);
  }, [pokemon]);

  const handleBackgroundSelect = (background: VariantBackground | null) => {
    setSelectedBackground(background);
    onSelectBackground?.(background);
  };

  const defaultFilter = (background: VariantBackground) => {
    if (!pokemon || !background) return false;
    if (selectedCostumeId != null) {
      if (!background.costume_id) return true;
      return background.costume_id === selectedCostumeId;
    } else if (pokemon.variantType) {
      const variantTypeId = pokemon.variantType.split('_')[1];
      if (!background.costume_id) return true;
      return background.costume_id === parseInt(variantTypeId, 10);
    }
    return true;
  };

  const isSelectable = filterBackground || defaultFilter;
  const selectableBackgrounds = pokemon?.backgrounds?.filter(isSelectable) || [];

  return (
    <div className={containerClassName}>
      <h3>{title}</h3>
      <div className="background-list">
        <div
          className={`${itemClassName} ${selectedBackground === null ? selectedItemClassName : ''}`}
          onClick={() => handleBackgroundSelect(null)}
        >
          <div className="none-option">None</div>
        </div>
        {selectableBackgrounds.map((background) => (
          <div
            key={background.background_id}
            className={`${itemClassName} ${selectedBackground === background ? selectedItemClassName : ''}`}
            onClick={() => handleBackgroundSelect(background)}
          >
            <img src={background.image_url} alt={background.name} />
            <div className="background-info">
              <p>{background.location}</p>
              <p>{background.date}</p>
            </div>
          </div>
        ))}
      </div>
      {selectedBackground && (
        <div className="selected-background">
          <h4>Selected Background:</h4>
          <p>{selectedBackground.name}</p>
          <img src={selectedBackground.image_url} alt={selectedBackground.name} />
        </div>
      )}
    </div>
  );
};

export default BackgroundLocationCard;
