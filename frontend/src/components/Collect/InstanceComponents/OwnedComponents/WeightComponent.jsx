// WeightComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import './WeightComponent.css';

const WeightComponent = ({ pokemon }) => {
  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  const [weight, setWeight] = useState(pokemon.weight);
  const [editMode, setEditMode] = useState(false);
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
      editableRef.current.innerText = weight || ''; // Make sure it's never null
      setCaretToEnd();
    }
  }, [editMode, weight]);

  const handleInput = (event) => {
    const newValue = event.target.innerText.replace('kg', '').trim();
    if (/^\d*\.?\d*$/.test(newValue)) { // Allow only numbers and decimal point
      setWeight(newValue);
    } else {
      event.target.innerText = weight; // Revert if invalid
    }
    setCaretToEnd();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveChanges(); // Trigger save when Enter is pressed
    }
  };

  const saveChanges = () => {
    setEditMode(false); // Toggle edit mode off after saving
  };

  const toggleAndSave = () => {
    if (editMode) {
      saveChanges();
    } else {
      setEditMode(true); // Toggle edit mode on if it's not already
    }
  };

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
            <span className="weight-editable-content">{weight ? weight : ''}</span>
          )}
          <span className="weight-suffix">kg</span>
          <button onClick={toggleAndSave} className="weight-icon-button">
            <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
          </button>
        </div>
        <div className="weight-label">Weight</div>
      </div>
    </div>
  );
};

export default WeightComponent;
