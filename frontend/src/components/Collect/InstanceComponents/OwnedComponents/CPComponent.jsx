// CPComponent.jsx

import React, { useState } from 'react';
import EditableSelect from './EditableSelect';
import './CPComponent.css';

const CPComponent = ({ pokemon }) => {
  const [cp, setCP] = useState(pokemon.ownershipStatus.cp);
  const [editMode, setEditMode] = useState(false);

  const toggleEdit = () => {
    setEditMode(!editMode);
    if (editMode) {
      handleSave();
    }
  };

  const handleSave = () => {
    console.log("Save CP:", cp);
  };

  const validateInput = (input) => /^\d*$/.test(input);  // Only allow digits

  return (
    <div className="cp-container">
      <div className={`cp-display ${!cp && 'only-label'}`}>
        <span className="cp-label">CP</span>
        <EditableSelect
          value={cp}
          editMode={editMode}
          toggleEdit={toggleEdit}
          onChange={setCP}
          inputValidator={validateInput}
        />
      </div>
    </div>
  );
};

export default CPComponent;