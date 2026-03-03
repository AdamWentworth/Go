// EditSaveComponent.tsx

import React from 'react';
import './EditSaveComponent.css';

type Props = {
  editMode: boolean;
  toggleEditMode: () => void;
  isEditable: boolean;
};

const EditSaveComponent: React.FC<Props> = ({ editMode, toggleEditMode, isEditable }) => {
  if (!isEditable) return null;

  const editIcon = `/images/edit-icon.png`;
  const saveIcon = `/images/save-icon.png`;

  return (
    <div className="edit-save-container">
      <button onClick={toggleEditMode} className="icon-button">
        <img src={editMode ? saveIcon : editIcon} alt={editMode ? 'Save' : 'Edit'} />
      </button>
    </div>
  );
};

export default EditSaveComponent;
