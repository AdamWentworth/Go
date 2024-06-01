import React from 'react';
import EditableText from './EditableText';

const WeightComponent = ({ weight, editMode, onChange, toggleEdit }) => {
  return (
    <EditableText
      label="Weight"
      field="weight"
      editMode={editMode}
      value={weight}
      onChange={onChange}
      toggleEdit={toggleEdit}
    />
  );
};

export default WeightComponent;
