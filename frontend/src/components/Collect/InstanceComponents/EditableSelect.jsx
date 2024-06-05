// EditableSelect.jsx
import React, { useState } from 'react';
import './EditableSelect.css';

const withEditableSelect = (WrappedComponent) => {
  return ({ value, onChange, ...props }) => {
    const [editMode, setEditMode] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    const toggleEdit = () => {
      setEditMode(!editMode);
      if (!editMode) {
        // Editing is starting
      } else {
        // Save changes
        onChange(currentValue.trim());
      }
    };

    const handleInputChange = (e) => {
      setCurrentValue(e.target.value);
    };

    return (
      <div className="editable-container">
        {editMode ? (
          <input
            type="text"
            value={currentValue}
            onChange={handleInputChange}
            onBlur={toggleEdit}
            autoFocus
          />
        ) : (
          <WrappedComponent {...props} value={currentValue} onClick={toggleEdit} />
        )}
      </div>
    );
  };
};

export default withEditableSelect;
