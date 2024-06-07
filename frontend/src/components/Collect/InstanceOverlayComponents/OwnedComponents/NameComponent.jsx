// NameComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import './NameComponent.css';
import { getLastWord } from '../../utils/formattingHelpers';

const NameComponent = ({ pokemon }) => {
  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  // Determine the initial nickname or use the last word of the Pokemon's name.
  const initialNickname = () => {
    return pokemon.ownershipStatus.nickname && pokemon.ownershipStatus.nickname.trim() !== ''
      ? pokemon.ownershipStatus.nickname
      : getLastWord(pokemon.name);
  };

  const [nickname, setNickname] = useState(initialNickname());
  const [editMode, setEditMode] = useState(false);
  const editableRef = useRef(null);

  // Function to set the caret position to the end of the editable content.
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

  // Effect to manage editable content and focus.
  useEffect(() => {
    if (editMode && editableRef.current) {
      editableRef.current.innerHTML = nickname || '&nbsp;';
      setCaretToEnd();
    }
  }, [editMode, nickname]);

  // Handle input changes and validate them.
  const handleInput = (event) => {
    let newValue = event.target.innerText;
    if (!newValue.trim()) {
      event.target.innerHTML = '&nbsp;'; // Maintain space when completely empty.
    }
    if (validateNickname(newValue.trim())) {
      setNickname(newValue.trim());
    }
    setCaretToEnd();
  };

  // Handle the Enter key to trigger save.
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      toggleAndSave();
    }
  };

  // Toggle editing mode and save logic.
  const toggleAndSave = () => {
    if (editMode) {
      const trimmedNickname = nickname.trim();
      if (!trimmedNickname) {
        setNickname(getLastWord(pokemon.name)); // Set to Pokemon's name if empty.
      } else {
        setNickname(trimmedNickname);
      }
      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  // Validate nickname to ensure it does not exceed 12 characters.
  const validateNickname = (input) => {
    return input.length <= 12;
  };

  return (
    <div className="name-container">
      <div className="name-display">
        <div className="name-center-content">
          {editMode ? (
            <span
              contentEditable
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              ref={editableRef}
              className="name-editable-content"
            >
              {nickname || '&nbsp;'}
            </span>
          ) : (
            <span className="name-editable-content">{nickname || getLastWord(pokemon.name)}</span>
          )}
          <button onClick={toggleAndSave} className="name-icon-button">
            <img src={editMode ? saveIcon : editIcon} alt="Edit" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NameComponent;
