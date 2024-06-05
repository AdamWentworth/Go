// EditableSelect.jsx

import React, { useEffect, useRef, useState } from 'react';
import './EditableSelect.css';

const EditableSelect = ({ value, editMode, toggleEdit, onChange, inputValidator }) => {
  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  const editableRef = useRef(null);
  const [currentValue, setCurrentValue] = useState(value || '');

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = currentValue || ''; // Ensure null doesn't cause an error
      setCaretToEnd();
    }
  }, [editMode, currentValue]);

  useEffect(() => {
    setCurrentValue(value || ''); // Ensure value is never null
  }, [value]);

  const handleInput = (event) => {
    const newValue = event.target.innerText;
    if (inputValidator(newValue) || newValue === '') {
      setCurrentValue(newValue);
    } else {
      event.target.innerText = currentValue; // Revert if input is invalid
    }
    setCaretToEnd();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveChanges();  // Save when Enter is pressed
    }
  };

  const saveChanges = () => {
    toggleEdit();  // Toggle editing mode off
    // Handle cases where currentValue could be empty or null
    onChange(currentValue && currentValue.trim() ? currentValue : null);
  };

  function setCaretToEnd() {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(editableRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return (
    <div className="editableSelect__container">
      {editMode ? (
        <span
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          ref={editableRef}
          className="editableSelect__editable-content"
        >
          {currentValue || ''}
        </span>
      ) : (
        <span className="editableSelect__editable-content">{value || ''}</span>
      )}
      <button onClick={saveChanges} className="editableSelect__icon-button">
        <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
      </button>
    </div>
  );
};

export default EditableSelect;
