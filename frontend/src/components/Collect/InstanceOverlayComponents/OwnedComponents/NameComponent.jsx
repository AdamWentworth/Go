// NameComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import './NameComponent.css';
import { getLastWord } from '../../utils/formattingHelpers';

const NameComponent = ({ pokemon, editMode, onNicknameChange }) => {
  const initialNickname = () => {
    return pokemon.ownershipStatus.nickname && pokemon.ownershipStatus.nickname.trim() !== ''
      ? pokemon.ownershipStatus.nickname
      : '';
  };

  const [nickname, setNicknameState] = useState(initialNickname());
  const editableRef = useRef(null);

  useEffect(() => {
    setNicknameState(initialNickname());
  }, [pokemon.ownershipStatus.nickname, pokemon.name]);

  useEffect(() => {
    if (editMode && editableRef.current) {
      // Ensure React is in charge of updates
      editableRef.current.textContent = nickname;
      setCaretToEnd();
    }
  }, [editMode, nickname]);

  const setCaretToEnd = () => {
    if (editableRef.current) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editableRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      editableRef.current.focus();
    }
  };

  const handleInput = (event) => {
    const newValue = event.target.textContent;
    if (newValue.trim() === '') {
      // If the input is cleared, we treat nickname as null/empty
      setNicknameState('');
      onNicknameChange(''); // Pass empty value to parent
    } else if (validateNickname(newValue)) {
      setNicknameState(newValue);
      onNicknameChange(newValue);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editableRef.current.blur();
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
              {nickname}
            </span>
          ) : (
            <span className="name-editable-content">
              {nickname || getLastWord(pokemon.name)} {/* Fallback to default name if nickname is empty */}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NameComponent;