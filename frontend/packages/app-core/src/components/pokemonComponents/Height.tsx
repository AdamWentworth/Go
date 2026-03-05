// Height.tsx
import React, { useEffect, useState } from 'react';
import './Height.css';

type PokemonWithHeight = {
  instanceData?: {
    height?: number | null;
  };
  sizes?: {
    height_xxs_threshold: number;
    height_xs_threshold: number;
    height_xl_threshold: number;
    height_xxl_threshold: number;
  };
};

type Props = {
  pokemon: PokemonWithHeight;
  editMode: boolean;
  onHeightChange?: (height: string) => void;
};

const Height: React.FC<Props> = ({ pokemon, editMode, onHeightChange }) => {
  const [height, setHeight] = useState<string>(
    pokemon.instanceData?.height ? String(pokemon.instanceData.height) : ''
  );

  useEffect(() => {
    setHeight(pokemon.instanceData?.height ? String(pokemon.instanceData.height) : '');
  }, [pokemon.instanceData?.height]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.trim();
    if (/^\d*\.?\d*$/.test(newValue)) {
      setHeight(newValue);
      onHeightChange?.(newValue);
    }
  };

  const handleBlur = () => {
    setHeight((prev) => (prev ? prev.trim() : ''));
  };

  if (!editMode && !height) return null;

  const heightVal = parseFloat(height);
  let heightCategory = '';
  if (!isNaN(heightVal) && pokemon.sizes) {
    if (heightVal < pokemon.sizes.height_xxs_threshold) {
      heightCategory = 'XXS';
    } else if (heightVal < pokemon.sizes.height_xs_threshold) {
      heightCategory = 'XS';
    } else if (heightVal > pokemon.sizes.height_xxl_threshold) {
      heightCategory = 'XXL';
    } else if (heightVal > pokemon.sizes.height_xl_threshold) {
      heightCategory = 'XL';
    }
  }

  return (
    <div className="height-container">
      <div className="height-display">
        <div className={`height-editable-container ${editMode ? 'editable' : ''}`}>
          {editMode ? (
            <input
              type="text"
              inputMode="decimal"
              className="height-editable-content height-input"
              value={height}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-label="Height in meters"
            />
          ) : (
            <span className="height-editable-content">{height}</span>
          )}
          <span className="height-suffix">m</span>
          {heightCategory && (
            <span className="height-category-tag">{heightCategory}</span>
          )}
        </div>
        <div className="height-label">Height</div>
      </div>
    </div>
  );
};

export default Height;
