// Weight.tsx
import React, { useEffect, useRef, useState } from 'react';
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
  const [userFocus, setUserFocus] = useState(false);
  const editableRef = useRef<HTMLSpanElement>(null);

  const setCaretToEnd = () => {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editableRef.current) {
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editableRef.current.focus();
    }
  };

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = weight || '';
      if (userFocus) {
        setCaretToEnd();
      }
    }
  }, [editMode, weight, userFocus]);

  const handleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    const newValue = event.currentTarget.innerText.replace('kg', '').trim();
    if (/^\d*\.?\d*$/.test(newValue)) {
      setWeight(newValue);
      onWeightChange(newValue);
    } else {
      event.currentTarget.innerText = weight;
    }
    if (userFocus) {
      setCaretToEnd();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editableRef.current?.blur();
      setUserFocus(false);
    }
  };

  useEffect(() => {
    if (!editMode) {
      setWeight((prev) => (prev ? prev.trim() : ''));
      setUserFocus(false);
    }
  }, [editMode]);

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
            <span
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onClick={() => setUserFocus(true)}
              onTouchStart={() => setUserFocus(true)}
              ref={editableRef}
              className="weight-editable-content"
            >
              {weight}
            </span>
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
