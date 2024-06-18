// GenderComponent.jsx
import React, { useState, useEffect } from 'react';
import './GenderComponent.css';

const GenderComponent = ({ pokemon, editMode, onGenderChange }) => {
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const maleIcon = `/images/male-icon.png`;
  const femaleIcon = `/images/female-icon.png`;

  const toggleGender = () => {
    if (editMode) {
      let newGender;
      if (gender === 'Genderless' || gender == null) {
        newGender = 'Male';
      } else if (gender === 'Male') {
        newGender = 'Female';
      } else if (gender === 'Female') {
        newGender = 'Genderless';
      }
      setGender(newGender);
      onGenderChange(newGender);  // Notify parent component of the change
    }
  };

  useEffect(() => {
    setGender(pokemon.ownershipStatus.gender);  // Reset state when pokemon changes
  }, [pokemon]);

  return (
    <div className={`gender-container ${editMode ? 'editable' : ''}`} onClick={toggleGender} role="button" aria-label={`Change gender to ${gender === 'Male' ? 'Female' : gender === 'Female' ? 'Genderless' : 'Male'}`}>
      <label className="gender-label" aria-hidden="true"></label>
      <div className="gender-display">
        {gender === 'Male' && <img src={maleIcon} alt="Male" className="gender-icon" />}
        {gender === 'Female' && <img src={femaleIcon} alt="Female" className="gender-icon" />}
        {(gender === 'Genderless' || gender == null) && <span className="gender-text">Genderless</span>}
      </div>
    </div>
  );
};

export default GenderComponent;