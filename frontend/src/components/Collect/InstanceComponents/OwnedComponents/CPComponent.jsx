// CPComponent.jsx

import React, { useEffect, useRef, useState } from 'react';
import './CPComponent.css';

const CPComponent = ({ pokemon }) => {
  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  const [cp, setCP] = useState(pokemon.ownershipStatus.cp);
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
      editableRef.current.innerText = cp || ''; // Make sure it's never null
      setCaretToEnd();
    }
  }, [editMode, cp]);

  const handleInput = (event) => {
    const newValue = event.target.innerText;
    if (/^\d{0,4}$/.test(newValue)) { // Only allow up to 4 digits
      setCP(newValue);
    } else {
      event.target.innerText = cp; // Revert if invalid
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
    if (cp) { // Check if cp is not null or empty
      setCP(cp.trim());
    } else {
      setCP(''); // Reset to an empty string if cp is null
    }
    setEditMode(false); // Correctly toggle edit mode off after saving
  };

  const toggleAndSave = () => {
    if (editMode) {
      saveChanges();
    } else {
      setEditMode(true); // Correctly toggle edit mode on if it's not already
    }
  };

  return (
    <div className="cp-container">
      <div className="cp-display">
        <div className="cp-center-content">
          <span className="cp-label">CP</span>
          <div className="cp-editable-container">
            {editMode ? (
              <span
                contentEditable
                suppressContentEditableWarning={true}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                ref={editableRef}
                className="cp-editable-content"
              >
                {cp || ''}
              </span>
            ) : (
              <span className="cp-editable-content">{cp || ''}</span>
            )}
            <button onClick={toggleAndSave} className="cp-icon-button">
              <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPComponent;
