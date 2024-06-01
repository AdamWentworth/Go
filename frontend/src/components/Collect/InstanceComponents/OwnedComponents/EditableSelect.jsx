// EditableSelect.jsx

import React, { useEffect, useRef } from 'react';
import './EditableSelect.css';

const EditableSelect = ({ value, editMode, toggleEdit, onChange }) => {
  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  const editableRef = useRef(null);

  useEffect(() => {
    if (editMode && editableRef.current) {
      const textNode = editableRef.current.firstChild;
      const textLength = editableRef.current.innerText.length;
  
      const range = document.createRange();
      const selection = window.getSelection();
  
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        // Ensure we don't exceed the text node length
        const safeLength = Math.min(textLength, textNode.length);
        range.setStart(textNode, safeLength);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // If there's no text node or it's not a type we expect, set at the start
        range.selectNodeContents(editableRef.current);
        range.collapse(true);  // Collapse to start if no suitable text node
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [editMode, value]);  

  const handleInput = (event) => {
    const newValue = event.target.innerText;
    // Ensure the input is numeric
    if (/^\d*$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="editable-select">
      {editMode ? (
        <span
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleInput}
          ref={editableRef}
          className="editable-content"
        >
          {value}
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