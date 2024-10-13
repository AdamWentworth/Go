// GenderComponent.jsx
import React, { useState, useEffect } from 'react';
import './GenderComponent.css';

const GenderComponent = ({ pokemon, editMode, onGenderChange }) => {
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const [availableGenders, setAvailableGenders] = useState([]);
  
  const maleIcon = `/images/male-icon.png`;
  const femaleIcon = `/images/female-icon.png`;

  // Parse the gender_rate and determine available genders
  const parseGenderRate = (genderRate) => {
    const [maleRate, femaleRate, genderlessRate] = genderRate.split('_').map(rate => parseInt(rate));
    const genders = [];
    if (maleRate > 0) genders.push('Male');
    if (femaleRate > 0) genders.push('Female');
    if (genderlessRate > 0) genders.push('Genderless');
    return genders;
  };

  const toggleGender = () => {
    if (editMode && availableGenders.length > 0) {
      let currentIndex = availableGenders.indexOf(gender);
      let newGender = availableGenders[(currentIndex + 1) % availableGenders.length];  // Cycle through available genders
      setGender(newGender);
      onGenderChange(newGender);  // Notify parent component of the change
    }
  };

  useEffect(() => {
    // Parse gender rate when component mounts or when pokemon changes
    const genders = parseGenderRate(pokemon.gender_rate);
    setAvailableGenders(genders);

    // If gender is null, set it to Genderless (if it's available) when editMode is on
    if (pokemon.ownershipStatus.gender == null && genders.includes('Genderless')) {
      setGender('Genderless');
    } else {
      setGender(pokemon.ownershipStatus.gender);
    }
  }, [pokemon]);

  return (
    <div className={`gender-container ${editMode ? 'editable' : ''}`} onClick={toggleGender} role="button" aria-label={`Change gender to ${gender === 'Male' ? 'Female' : gender === 'Female' ? 'Genderless' : 'Male'}`}>
      <label className="gender-label" aria-hidden="true"></label>
      <div className="gender-display">
        {gender === 'Male' && <img src={maleIcon} alt="Male" className="gender-icon" />}
        {gender === 'Female' && <img src={femaleIcon} alt="Female" className="gender-icon" />}
        {/* Only show "Genderless" if editMode is ON */}
        {editMode && (gender === 'Genderless' || gender == null) && <span className="gender-text">Genderless</span>}
        {/* Hide "Genderless" or null gender when editMode is OFF */}
      </div>
    </div>
  );
};

export default GenderComponent;