// HeightComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import './HeightComponent.css';

const HeightComponent = ({ pokemon }) => {
  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  const [height, setHeight] = useState(pokemon.height);
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
      editableRef.current.innerText = height || ''; // Make sure it's never null
      setCaretToEnd();
    }
  }, [editMode, height]);

  const handleInput = (event) => {
    const newValue = event.target.innerText.replace('m', '').trim();
    if (/^\d*\.?\d*$/.test(newValue)) { // Allow only numbers and decimal point
      setHeight(newValue);
    } else {
      event.target.innerText = height; // Revert if invalid
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
    <div className="height-container">
      <div className="height-display">
        <div className="height-editable-container">
          {editMode ? (
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              ref={editableRef}
              className="height-editable-content"
            >
              {height}
            </span>
          ) : (
            <span className="height-editable-content">{height ? height : ''}</span>
          )}
          <span className="height-suffix">m</span>
          <button onClick={toggleAndSave} className="height-icon-button">
            <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
          </button>
        </div>
        <div className="height-label">Height</div>
      </div>
    </div>
  );
};

export default HeightComponent;
