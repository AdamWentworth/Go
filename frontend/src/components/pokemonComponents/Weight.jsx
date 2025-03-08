// Weight.jsx
import React, { useEffect, useRef, useState } from 'react';
import './Weight.css';

const Weight = ({ pokemon, editMode, onWeightChange }) => {
  const [weight, setWeight] = useState(
    pokemon.ownershipStatus.weight ? String(pokemon.ownershipStatus.weight) : ''
  );
  const editableRef = useRef(null);

  // Helper function to move cursor to end
  function setCaretToEnd() {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editableRef.current) {
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editableRef.current.focus();
    }
  }

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = weight || '';
      setCaretToEnd();
    }
  }, [editMode, weight]);

  const handleInput = (event) => {
    const newValue = event.target.innerText.replace('kg', '').trim();
    if (/^\d*\.?\d*$/.test(newValue)) { // Allow only numbers and decimal point
      setWeight(newValue);
      onWeightChange(newValue);  // Notify parent component of the change
    } else {
      event.target.innerText = weight;
    }
    setCaretToEnd();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (!editMode) {
      setWeight((prevWeight) => (prevWeight ? prevWeight.trim() : ''));
    }
  }, [editMode]);

  // If weight is null or empty and not in edit mode, render nothing.
  if (!editMode && !weight) {
    return null;
  }

  // Determine the weight category tag based on pokemon.sizes thresholds.
  const weightVal = parseFloat(weight);
  let weightCategory = '';
  if (!isNaN(weightVal) && pokemon.sizes) {
    if (weightVal < pokemon.sizes.weight_xxs_threshold) {
      weightCategory = 'XXS';
    } else if (weightVal < pokemon.sizes.weight_xs_threshold) {
      weightCategory = 'XS';
    } else if (weightVal > pokemon.sizes.weight_xxl_threshold) {
      weightCategory = 'XXL';
    } else if (weightVal > pokemon.sizes.weight_xl_threshold) {
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
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              ref={editableRef}
              className="weight-editable-content"
            >
              {weight}
            </span>
          ) : (
            <span className="weight-editable-content">{weight}</span>
          )}
          <span className="weight-suffix">kg</span>
          {/* Display the weight category tag if determined */}
          {weightCategory && (
            <span className="weight-category-tag">{weightCategory}</span>
          )}
        </div>
        <div className="weight-label">Weight</div>
      </div>
    </div>
  );
};

export default Weight;