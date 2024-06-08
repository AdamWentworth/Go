// WeightComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import './WeightComponent.css';

const WeightComponent = ({ pokemon, editMode }) => {
  const [weight, setWeight] = useState(pokemon.weight ? String(pokemon.weight) : '');
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

  return (
    <div className="weight-container">
      <div className="weight-display">
        <div className="weight-editable-container">
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
        </div>
        <div className="weight-label">Weight</div>
      </div>
    </div>
  );
};

export default WeightComponent;
