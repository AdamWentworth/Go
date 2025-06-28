// CP.tsx

import React, { useEffect, useRef, useState } from 'react';
import './CP.css';

type Props = {
  cp: string | number | null;
  editMode: boolean;
  onCPChange: (value: string) => void;
  errors?: {
    cp?: string;
  };
};

const CP: React.FC<Props> = ({ cp, editMode, onCPChange, errors = {} }) => {
  const editableRef = useRef<HTMLSpanElement>(null);
  const cpString = cp != null ? cp.toString() : '';
  const [userFocus, setUserFocus] = useState(false);

  const setCaretToEnd = () => {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editableRef.current && sel) {
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerText = cpString;
      if (userFocus) setCaretToEnd();
    }
  }, [editMode, cpString, userFocus]);

  const handleInput = (event: React.FormEvent<HTMLSpanElement>) => {
    const newValue = event.currentTarget.innerText;
    if (/^\d{0,5}$/.test(newValue)) {
      onCPChange(newValue);
    } else {
      event.currentTarget.innerText = cpString;
    }
    if (userFocus) setCaretToEnd();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editableRef.current?.blur();
      setUserFocus(false);
    }
  };

  const handleBlur = () => {
    onCPChange(cpString.trim());
    setUserFocus(false);
  };

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
          setUserFocus(true);
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
              suppressContentEditableWarning
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onClick={() => setUserFocus(true)}
              onTouchStart={() => setUserFocus(true)}
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
