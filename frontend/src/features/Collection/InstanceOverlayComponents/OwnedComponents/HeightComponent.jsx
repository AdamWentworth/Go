// HeightComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import './HeightComponent.css';

const HeightComponent = ({ pokemon, editMode, onHeightChange }) => {
  const [height, setHeight] = useState(pokemon.ownershipStatus.height ? String(pokemon.ownershipStatus.height) : '');
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
      onHeightChange(newValue);  // Notify parent component of the change
    } else {
      event.target.innerText = height; // Revert if invalid
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
      setHeight((prevHeight) => (prevHeight ? prevHeight.trim() : ''));
    }
  }, [editMode]);

  // New behavior: If height is null or empty and editMode is off, render nothing
  if (!editMode && !height) {
    return null;
  }

  return (
    <div className="height-container">
      <div className="height-display">
        <div className={`height-editable-container ${editMode ? 'editable' : ''}`}>
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
        </div>
        <div className="height-label">Height</div>
      </div>
    </div>
  );
};

export default HeightComponent;
