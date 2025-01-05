// GenderComponent.jsx
import React, { useState, useEffect } from 'react';
import './GenderComponent.css';

const GenderComponent = ({ pokemon, editMode, onGenderChange }) => {
  const [gender, setGender] = useState(pokemon?.ownershipStatus?.gender || null);
  const [availableGenders, setAvailableGenders] = useState([]);

  const maleIcon = `/images/male-icon.png`;
  const femaleIcon = `/images/female-icon.png`;

  // Parse the gender_rate and determine available genders
  const parseGenderRate = (genderRate) => {
    try {
      const [maleRate, femaleRate, genderlessRate] = (genderRate || "0_0_0")
        .split('_')
        .map((rate) => parseInt(rate, 10) || 0);
      const genders = [];
      if (maleRate > 0) genders.push('Male');
      if (femaleRate > 0) genders.push('Female');
      if (genderlessRate > 0) genders.push('Genderless');
      return genders;
    } catch (error) {
      console.error('Error parsing genderRate:', error);
      return [];
    }
  };

  const toggleGender = () => {
    if (editMode && availableGenders.length > 0) {
      const currentIndex = availableGenders.indexOf(gender);
      const newGender =
        availableGenders[(currentIndex + 1) % availableGenders.length]; // Cycle through available genders
      setGender(newGender);
      onGenderChange?.(newGender); // Notify parent component if callback is provided
    }
  };

  useEffect(() => {
    if (!pokemon) {
      console.warn('Pokemon data is missing.');
      return;
    }

    // Parse gender rate when component mounts or when pokemon changes
    const genders = parseGenderRate(pokemon.gender_rate);
    setAvailableGenders(genders);

    // If gender is null, set it to Genderless (if available) or default to the first available gender
    if (!pokemon.ownershipStatus?.gender && genders.length > 0) {
      const defaultGender = genders.includes('Genderless')
        ? 'Genderless'
        : genders[0];
      setGender(defaultGender);
    } else {
      setGender(pokemon.ownershipStatus.gender);
    }
  }, [pokemon]);

  return (
    <div
      className={`gender-container ${editMode ? 'editable' : ''}`}
      onClick={toggleGender}
      role="button"
      aria-label={`Change gender to ${
        gender === 'Male' ? 'Female' : gender === 'Female' ? 'Genderless' : 'Male'
      }`}
    >
      <label className="gender-label" aria-hidden="true"></label>
      <div className="gender-display">
        {gender === 'Male' && <img src={maleIcon} alt="Male" className="gender-icon" />}
        {gender === 'Female' && <img src={femaleIcon} alt="Female" className="gender-icon" />}
        {editMode && (gender === 'Genderless' || gender == null) && (
          <span className="gender-text">Genderless</span>
        )}
      </div>
    </div>
  );
};

export default GenderComponent;
