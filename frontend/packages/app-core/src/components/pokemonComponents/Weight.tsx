// Weight.tsx
import React, { useEffect, useState } from 'react';
import './Weight.css';

type PokemonWithWeight = {
  instanceData?: {
    weight?: number | null;
  };
  sizes?: {
    weight_xxs_threshold: number;
    weight_xs_threshold: number;
    weight_xl_threshold: number;
    weight_xxl_threshold: number;
  };
};

type Props = {
  pokemon: PokemonWithWeight;
  editMode: boolean;
  onWeightChange: (newWeight: string) => void;
};

const Weight: React.FC<Props> = ({ pokemon, editMode, onWeightChange }) => {
  const [weight, setWeight] = useState<string>(
    pokemon.instanceData?.weight ? String(pokemon.instanceData.weight) : ''
  );

  useEffect(() => {
    setWeight(pokemon.instanceData?.weight ? String(pokemon.instanceData.weight) : '');
  }, [pokemon.instanceData?.weight]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.trim();
    if (/^\d*\.?\d*$/.test(newValue)) {
      setWeight(newValue);
      onWeightChange(newValue);
    }
  };

  const handleBlur = () => {
    setWeight((prev) => (prev ? prev.trim() : ''));
  };

  if (!editMode && !weight) return null;

  const weightVal = parseFloat(weight);
  let weightCategory = '';

  if (!isNaN(weightVal) && pokemon.sizes) {
    const { weight_xxs_threshold, weight_xs_threshold, weight_xl_threshold, weight_xxl_threshold } = pokemon.sizes;
    if (weightVal < weight_xxs_threshold) {
      weightCategory = 'XXS';
    } else if (weightVal < weight_xs_threshold) {
      weightCategory = 'XS';
    } else if (weightVal > weight_xxl_threshold) {
      weightCategory = 'XXL';
    } else if (weightVal > weight_xl_threshold) {
      weightCategory = 'XL';
    }
  }

  return (
    <div className="weight-container">
      <div className="weight-display">
        <div className={`weight-editable-container ${editMode ? 'editable' : ''}`}>
          {editMode ? (
            <input
              type="text"
              inputMode="decimal"
              className="weight-editable-content weight-input"
              value={weight}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-label="Weight in kilograms"
            />
          ) : (
            <span className="weight-editable-content">{weight}</span>
          )}
          <span className="weight-suffix">kg</span>
          {weightCategory && <span className="weight-category-tag">{weightCategory}</span>}
        </div>
        <div className="weight-label">Weight</div>
      </div>
    </div>
  );
};

export default Weight;
