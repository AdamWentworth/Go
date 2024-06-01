import React from 'react';
import EditableSelect from './EditableSelect';

const GenderComponent = ({ gender, editMode, onChange, toggleEdit }) => {
  return (
    <EditableSelect
      label="Gender"
      field="gender"
      options={['Male', 'Female', 'Genderless']}
      editMode={editMode}
      value={gender}
      onChange={onChange}
      toggleEdit={toggleEdit}
      className="gender-container"
    />
  );
};

export default GenderComponent;
