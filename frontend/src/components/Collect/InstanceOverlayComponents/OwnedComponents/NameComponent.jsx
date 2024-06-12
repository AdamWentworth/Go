// NameComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import './NameComponent.css';
import { getLastWord } from '../../utils/formattingHelpers';

const NameComponent = ({ pokemon, editMode }) => {
  const initialNickname = () => {
    return pokemon.ownershipStatus.nickname && pokemon.ownershipStatus.nickname.trim() !== ''
      ? pokemon.ownershipStatus.nickname
      : getLastWord(pokemon.name);
  };

  const [nickname, setNickname] = useState(initialNickname());
  const editableRef = useRef(null);

  const setCaretToEnd = () => {
    const range = document.createRange();
    const sel = window.getSelection();
    if (editableRef.current) {
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editableRef.current.focus();
    }
  };

  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerHTML = nickname || '&nbsp;';
      setCaretToEnd();
    }
  }, [editMode, nickname]);

  const handleInput = (event) => {
    let newValue = event.target.innerText;
    if (!newValue.trim()) {
      event.target.innerHTML = '&nbsp;';
    }
    if (validateNickname(newValue.trim())) {
      setNickname(newValue.trim());
    }
    setCaretToEnd();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const validateNickname = (input) => {
    return input.length <= 12;
  };

  return (
    <div className="name-container">
      <div className="name-display">
        <div className="name-center-content">
          {editMode ? (
              <span
              contentEditable={editMode}
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              ref={editableRef}
              className={`name-editable-content ${editMode ? 'editable' : ''}`}
            >
              {nickname || '&nbsp;'}
            </span>
          ) : (
            <span className="name-editable-content">{nickname || getLastWord(pokemon.name)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NameComponent;