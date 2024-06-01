// NameComponent.jsx

import React, { useState, useEffect } from 'react';
import { getLastWord } from '../../utils/formattingHelpers';
import EditableSelect from './EditableSelect';

const NameComponent = ({ pokemon }) => {
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname || getLastWord(pokemon.name));
  const [editMode, setEditMode] = useState(false);

  const toggleEdit = () => {
    setEditMode(!editMode);
    if (!editMode) {
      // This will trigger when edit mode is turned off and saving needs to happen
      handleSave();
    }
  };

  const handleChange = (event) => {
    setNickname(event.target.value);
  };

  const handleSave = () => {
    console.log("Save nickname:", nickname);
    // Implement saving logic or pass the nickname up to the parent component if needed
  };

  // Prepare dummy options to fulfill the requirement of EditableSelect though they won't be used
  const dummyOptions = []; 

  return (
    <div className="nickname-container">
      <EditableSelect
        label=""
        field="nickname"
        options={dummyOptions} // Options aren't used but required by component API
        editMode={editMode}
        value={nickname}
        onChange={handleChange}
        toggleEdit={toggleEdit}
      />
    </div>
  );
};

export default NameComponent;
