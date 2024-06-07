// GenderComponent.jsx
import React, { useState } from 'react';
import './GenderComponent.css';

const GenderComponent = ({ pokemon }) => {
  const [editMode, setEditMode] = useState(false);
  const [gender, setGender] = useState(pokemon.gender);
  const maleIcon = `/images/male-icon.png`;
  const femaleIcon = `./images/female-icon.png`;
  const editIcon = `./images/edit-icon.png`;
  const saveIcon = `./images/save-icon.png`;

  const toggleEdit = () => {
    setEditMode(!editMode);
  };

  const toggleGender = () => {
    if (editMode) {
      if (gender === 'Genderless' || gender == null) {
        setGender('Male');
      } else if (gender === 'Male') {
        setGender('Female');
      } else if (gender === 'Female') {
        setGender('Genderless');
      }
    }
  };

  const saveChanges = () => {
    // Here you would normally save the changes to the backend or parent state
    setEditMode(false);
  };

  return (
    <div className="gender-container">
      <label className="gender-label"></label>
      <div className="gender-display" onClick={toggleGender}>
        {gender === 'Male' && <img src={maleIcon} alt="Male" className="gender-icon" />}
        {gender === 'Female' && <img src={femaleIcon} alt="Female" className="gender-icon" />}
        {(gender === 'Genderless' || gender == null) && <span className="gender-text">Genderless</span>}
      </div>
      <button onClick={toggleEdit} className="gender-icon-button">
        <img src={editMode ? saveIcon : editIcon} alt={editMode ? "Save" : "Edit"} />
      </button>
    </div>
  );
};

export default GenderComponent;
