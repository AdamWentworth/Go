// CPComponent.jsx

import React, { useEffect, useRef, useState } from 'react';
import './CPComponent.css';

const CPComponent = ({ pokemon, editMode, toggleEditMode, onCPChange }) => {
  const [cp, setCP] = useState(pokemon.ownershipStatus.cp || '');
  const editableRef = useRef(null);

  function setCaretToEnd() {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editableRef.current) {
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = cp;
      setCaretToEnd();  // Ensure cursor is at end when editing starts
    }
  }, [editMode, cp]);

  const handleInput = (event) => {
    const newValue = event.target.innerText;
    if (/^\d{0,4}$/.test(newValue)) {  // Allow only up to 4 digits (customize as necessary)
      setCP(newValue);
      onCPChange(newValue);  // Trigger update in parent state
    } else {
      event.target.innerText = cp;  // Reset to last valid value if input is invalid
    }
    setCaretToEnd();  // Ensure cursor is at end after input
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();  // Prevent line break on Enter
      editableRef.current.blur();  // Blur the editable element to stop editing
      toggleEditMode();  // Optionally toggle edit mode off if you have a method to manage it
    }
  };

  const handleBlur = () => {
    onCPChange(String(cp).trim());  // Ensure to trim and update on blur
  };

  const handleContainerClick = () => {
    if (editMode && editableRef.current) {
      editableRef.current.focus();  // Focus the editable element when the container is clicked
    }
  };

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
                onBlur={handleBlur}  // Handle blur to ensure updates are applied
                ref={editableRef}
                className="cp-editable-content"
              >
                {cp || ''}
              </span>
            ) : (
              <span className="cp-editable-content">{cp}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPComponent;
