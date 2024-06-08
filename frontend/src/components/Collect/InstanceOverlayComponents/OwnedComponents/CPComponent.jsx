// CPComponent.jsx

import React, { useEffect, useRef, useState } from 'react';
import './CPComponent.css';

const CPComponent = ({ pokemon, editMode, toggleEditMode }) => {
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
      editableRef.current.focus();
    }
  }

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = cp || '';
      setCaretToEnd();
    }
  }, [editMode, cp]);

  const handleInput = (event) => {
    const newValue = event.target.innerText;
    if (/^\d{0,4}$/.test(newValue)) {
      setCP(newValue);
    } else {
      event.target.innerText = cp;
    }
    setCaretToEnd();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      toggleEditMode();
    }
  };

  useEffect(() => {
    if (!editMode && cp) {
      setCP(cp.trim());
    }
  }, [editMode]);

  const handleContainerClick = () => {
    if (editMode && editableRef.current) {
      editableRef.current.focus();
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
                ref={editableRef}
                className="cp-editable-content"
              >
                {cp || ''}
              </span>
            ) : (
              <span className="cp-editable-content">{cp || ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPComponent;


