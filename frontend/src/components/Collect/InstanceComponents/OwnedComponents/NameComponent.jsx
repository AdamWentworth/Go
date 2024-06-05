// NameComponent.jsx
import React, { useState } from 'react';
import EditableSelect from './EditableSelect';
import { getLastWord } from '../../utils/formattingHelpers';
import './NameComponent.css';

const NameComponent = ({ pokemon }) => {
  const initialNickname = () => {
    return pokemon.ownershipStatus.nickname && pokemon.ownershipStatus.nickname.trim() !== ''
      ? pokemon.ownershipStatus.nickname
      : getLastWord(pokemon.name);
  };

  const [nickname, setNickname] = useState(initialNickname);
  const [editMode, setEditMode] = useState(false);

  const toggleEdit = () => {
    setEditMode(!editMode);
    if (!editMode) {
      console.log("Save nickname:", nickname);
    }
  };

  const handleChange = (newNickname) => {
    setNickname(newNickname);
  };

  // Validator function to ensure nickname is non-empty and up to 12 characters
  const validateNickname = (input) => {
    return input.trim() !== '' && input.length <= 12;
  };

  return (
    <div className="name-container">
      <div className="name-display">
        <div className="name-center-content">
          <span className="name-label"></span>
          <EditableSelect
            className="name-editable-container"
            editMode={editMode}
            value={nickname}
            onChange={handleChange}
            toggleEdit={toggleEdit}
            inputValidator={validateNickname}  // Pass the custom validator
          />
        </div>
      </div>
    </div>
  );
};

export default NameComponent;
