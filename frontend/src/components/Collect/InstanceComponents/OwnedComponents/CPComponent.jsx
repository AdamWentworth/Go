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
      console.log("Save CP:", cp); // handleSave function is directly here for simplicity.
    }
  };

  const validateInput = (input) => /^\d*$/.test(input);  // Only allow digits

  return (
    <div className="cpComponent__container">
      <div className="cpComponent__display">
        <div className="cpComponent__center-content">
          <span className="cpComponent__label">CP</span>
          <EditableSelect
            className="editableSelect__container"
            value={cp}
            editMode={editMode}
            toggleEdit={toggleEdit}
            onChange={setCP}
            inputValidator={validateInput}
          />
        </div>
      </div>
    </div>
  );
};

export default CPComponent;
