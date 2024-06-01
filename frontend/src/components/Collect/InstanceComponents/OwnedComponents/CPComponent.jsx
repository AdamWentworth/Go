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

  return (
    <div className="cp-container">
      <div className="label">CP:</div>
      <EditableSelect
        value={cp}
        editMode={editMode}
        toggleEdit={toggleEdit}
        onChange={setCP}
      />
    </div>
  );
};

export default CPComponent;