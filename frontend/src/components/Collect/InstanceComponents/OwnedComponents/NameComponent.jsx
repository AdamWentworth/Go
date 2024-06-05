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
    <div className="nameComponent__container">
      <div className="nameComponent__display">
        <div className="nameComponent__center-content">
          <span className="nameComponent__label"></span>
          <EditableSelect
            className="editableSelect__container"
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
