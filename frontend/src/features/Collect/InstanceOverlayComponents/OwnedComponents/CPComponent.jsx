// OwnedComponents/CPComponent.jsx

import React, { useEffect, useRef } from 'react';
import './CPComponent.css';

const CPComponent = ({ pokemon, editMode, onCPChange, cp, errors, computedCP }) => {
  const editableRef = useRef(null);

  const setCaretToEnd = () => {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editableRef.current) {
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = cp;
      setCaretToEnd(); // Ensure cursor is at end when editing starts
    }
  }, [editMode, cp]);

  const handleInput = (event) => {
    const newValue = event.target.innerText;
    if (/^\d{0,5}$/.test(newValue)) { // Allow up to 5 digits
      onCPChange(newValue); // Trigger update in parent state
    } else {
      event.target.innerText = cp; // Reset to last valid value if input is invalid
    }
    setCaretToEnd(); // Ensure cursor is at end after input
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent line break on Enter
      editableRef.current.blur(); // Remove focus from the input
    }
  };

  const handleBlur = () => {
    const trimmedCP = cp.toString().trim();
    onCPChange(trimmedCP); // Ensure CP is trimmed
  };

  const handleContainerClick = () => {
    if (editMode && editableRef.current) {
      editableRef.current.focus(); // Focus the editable element when the container is clicked
    }
  };

  // Conditional Rendering Logic
  if ((!cp || String(cp).trim() === '') && !editMode) {
    return null; // Do not render the component if cp is null/empty and not in edit mode
  }

  return (
    <div className="cp-container" onClick={handleContainerClick}>
      <div className="cp-display">
        <div className="cp-center-content">
          <span className="cp-label">CP</span>
          <div className={`cp-editable-container ${editMode ? 'editable' : ''}`}>
            {editMode ? (
              <span
                contentEditable
                suppressContentEditableWarning={true}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur} // Handle blur to ensure updates are applied
                ref={editableRef}
                className="cp-editable-content"
              >
                {cp || ''}
              </span>
            ) : (
              <span className="cp-editable-content">{cp}</span>
            )}
          </div>
          {/* Display computed CP if available and not in edit mode */}
          {!editMode && computedCP !== undefined && (
            <span className="computed-cp">Calculated CP: {computedCP}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CPComponent;
