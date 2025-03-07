// CP.jsx

import React, { useEffect, useRef } from 'react';
import './CP.css';

const CP = ({ cp, editMode, onCPChange, errors = {} }) => {
  const editableRef = useRef(null);
  const cpString = cp != null ? cp.toString() : '';

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
      editableRef.current.innerText = cpString;
      setCaretToEnd();
    }
  }, [editMode, cpString]);

  const handleInput = (event) => {
    const newValue = event.target.innerText;
    if (/^\d{0,5}$/.test(newValue)) {
      onCPChange(newValue);
    } else {
      event.target.innerText = cpString;
    }
    setCaretToEnd();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editableRef.current.blur();
    }
  };

  const handleBlur = () => {
    const trimmedCP = cpString.trim();
    onCPChange(trimmedCP);
  };

  // Instead of returning null when cp is empty in display mode,
  // return a placeholder that occupies the same space.
  if ((!cpString || cpString.trim() === '') && !editMode) {
    return (
      <div className="cp-unified-container">
        <div className="cp-unified-display" style={{ visibility: 'hidden' }}>
          <span className="cp-label">CP</span>
          <span className="cp-value">000</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cp-unified-container"
      onClick={() => {
        if (editMode && editableRef.current) {
          editableRef.current.focus();
        }
      }}
    >
      <div className="cp-unified-display">
        <span className="cp-label">CP</span>
        {editMode ? (
          <div className="cp-editable-container editable">
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              ref={editableRef}
              className="cp-editable-content"
            >
              {cpString}
            </span>
          </div>
        ) : (
          <span className="cp-value">{cpString}</span>
        )}
      </div>
      {!editMode && errors.cp && <div className="error">{errors.cp}</div>}
    </div>
  );
};

export default CP;