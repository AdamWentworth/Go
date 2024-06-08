// EditSaveComponent.jsx

import React from 'react';
import './EditSaveComponent.css';

const EditSaveComponent = ({ editMode, toggleEditMode }) => {
  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  return (
    <div className="edit-save-container">
      <button onClick={toggleEditMode} className="icon-button">
        <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
      </button>
    </div>
  );
};

export default EditSaveComponent;

