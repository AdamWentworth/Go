// NameComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import './NameComponent.css';
import { getLastWord } from '../../../../utils/formattingHelpers';

const NameComponent = ({ pokemon, editMode, onNicknameChange }) => {
  const initialNickname = () =>
    pokemon.ownershipStatus.nickname && pokemon.ownershipStatus.nickname.trim() !== ''
      ? pokemon.ownershipStatus.nickname
      : '';

  const [nickname, setNicknameState] = useState(initialNickname());
  const [userFocus, setUserFocus] = useState(false);
  const editableRef = useRef(null);

  useEffect(() => {
    setNicknameState(initialNickname());
  }, [pokemon.ownershipStatus.nickname, pokemon.name]);

  useEffect(() => {
    if (editMode && editableRef.current) {
      const defaultName = getLastWord(pokemon.name);
      const displayName = nickname || defaultName;
      editableRef.current.textContent = displayName;
      setNicknameState(displayName);
      if (userFocus) {
        setCaretToEnd();
      }
    }
  }, [editMode, nickname, pokemon.name, userFocus]);

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
    const defaultName = getLastWord(pokemon.name);
    if (newValue === '') {
      setNicknameState('');
      onNicknameChange(null);
    } else if (newValue === defaultName) {
      setNicknameState('');
      onNicknameChange(null);
    } else if (validateNickname(newValue)) {
      setNicknameState(newValue);
      onNicknameChange(newValue);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      editableRef.current.blur();
      setUserFocus(false);
    }
  };

  const validateNickname = (input) => input.length <= 12;

  // Reset the userFocus flag when leaving edit mode.
  useEffect(() => {
    if (!editMode) {
      setUserFocus(false);
    }
  }, [editMode]);

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
              onClick={() => setUserFocus(true)}
              onTouchStart={() => setUserFocus(true)}
              ref={editableRef}
              className={`name-editable-content ${editMode ? 'editable' : ''}`}
            >
              {nickname}
            </span>
          ) : (
            <span className="name-editable-content">
              {nickname || getLastWord(pokemon.name)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NameComponent;
