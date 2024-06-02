// EditableSelect.jsx

import React, { useEffect, useRef, useState } from 'react';
import './EditableSelect.css';

const EditableSelect = ({ value, editMode, toggleEdit, onChange, inputValidator }) => {
  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  const editableRef = useRef(null);
  const [currentValue, setCurrentValue] = useState(value || ''); // Initialize with value or empty string

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = currentValue;
      setCaretToEnd();  // Ensure caret is at the end after setting text
    }
  }, [editMode, currentValue]);

  useEffect(() => {
    setCurrentValue(value);  // Sync with external value
  }, [value]);

  const handleInput = (event) => {
    const newValue = event.target.innerText;
    if (inputValidator(newValue)) {
      setCurrentValue(newValue); // Update current value if it's valid
    } else {
      event.target.innerText = currentValue; // Revert if input is invalid
    }
    setCaretToEnd();  // Keep caret at end after updating text
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();  // Prevent the Enter key from creating a new line
      toggleEdit();
      onChange(currentValue);  // Pass the current value back to onChange
    }
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
    <div className="editable-select">
      {editMode ? (
        <span
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          ref={editableRef}
          className="editable-content"
        >
          {currentValue}
        </span>
      ) : (
        <span>{value}</span>
      )}
      <button onClick={toggleEdit} className="icon-button">
        <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
      </button>
    </div>
  );
};

export default EditableSelect;