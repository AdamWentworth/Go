// GenderComponent.jsx
import React, { useState } from 'react';
import './GenderComponent.css';

const GenderComponent = ({ pokemon, editMode }) => {
  const [gender, setGender] = useState(pokemon.gender);
  const maleIcon = `/images/male-icon.png`;
  const femaleIcon = `/images/female-icon.png`;

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

  return (
    <div className={`gender-container ${editMode ? 'editable' : ''}`} onClick={toggleGender}>
      <label className="gender-label"></label>
      <div className="gender-display">
        {gender === 'Male' && <img src={maleIcon} alt="Male" className="gender-icon" />}
        {gender === 'Female' && <img src={femaleIcon} alt="Female" className="gender-icon" />}
        {(gender === 'Genderless' || gender == null) && <span className="gender-text">Genderless</span>}
      </div>
    </div>
  );
};

export default GenderComponent;