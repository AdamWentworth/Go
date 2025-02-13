// NameComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import './NameComponent.css';
import { getLastWord } from '../../../../utils/formattingHelpers';

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
      const defaultName = getLastWord(pokemon.name);
      const displayName = nickname || defaultName; // Use nickname if present, otherwise default name
  
      editableRef.current.textContent = displayName;
      setNicknameState(displayName); // Ensure state is updated for editing
      setCaretToEnd();
    }
  }, [editMode, nickname, pokemon.name]);  

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
    const newValue = event.target.textContent.trim();
    const defaultName = getLastWord(pokemon.name); // Get last word from name
  
    if (newValue === '') {
      setNicknameState('');
      onNicknameChange(null); // Pass null for empty nickname
    } else if (newValue === defaultName) {
      setNicknameState('');
      onNicknameChange(null); // Nullify nickname if it matches default name
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