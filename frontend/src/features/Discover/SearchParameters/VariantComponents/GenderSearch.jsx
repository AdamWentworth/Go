// GenderSearch.jsx
import React, { useEffect, useState } from 'react';
import './GenderSearch.css';

const GenderSearch = ({ genderRate, selectedGender, onGenderChange }) => {
  const [availableGenders, setAvailableGenders] = useState([]);

  useEffect(() => {
    if (!genderRate) {
      setAvailableGenders([]);
      return;
    }

    // Parse genderRate and set available genders
    const parseGenderRate = (rate) => {
      const match = rate.match(/(\d+)/);
      return match ? parseInt(match[0], 10) : NaN;
    };

    const genderRateArray = genderRate.split('_');
    const maleRate = parseGenderRate(genderRateArray[0]);
    const femaleRate = parseGenderRate(genderRateArray[1]);
    const genderlessRate = parseGenderRate(genderRateArray[2]);

    const genders = [];

    if (genderlessRate === 100) {
      setAvailableGenders([]);  // Genderless Pokémon, no gender to display
    } else {
      if (maleRate > 0) genders.push('Male');
      if (femaleRate > 0) genders.push('Female');

      setAvailableGenders(genders);

      // If only one gender is available, set it automatically
      if (genders.length === 1) {
        onGenderChange(genders[0]);
      }
    }
  }, [genderRate, onGenderChange]);

  const toggleGender = () => {
    if (availableGenders.length === 2) {
      if (selectedGender === 'Any') {
        onGenderChange('Male');
      } else if (selectedGender === 'Male') {
        onGenderChange('Female');
      } else {
        onGenderChange('Any');
      }
    }
  };

  const getGenderIcon = () => {
    if (selectedGender === 'Male') {
      return '/images/male-icon.png';
    } else if (selectedGender === 'Female') {
      return '/images/female-icon.png';
    } else {
      return '/images/neutral-icon.png';
    }
  };

  return (
    <div
      className="gender-toggle-container"
      onClick={toggleGender}
      style={{
        cursor: availableGenders.length === 2 ? 'pointer' : 'default',
        minHeight: '40px'
      }}
    >
      {availableGenders.length > 0 ? (
        <img src={getGenderIcon()} alt={selectedGender} className="gender-icon" />
      ) : (
        <div style={{ minHeight: '40px' }}></div> // Empty div to reserve space
      )}
    </div>
  );
};

export default GenderSearch;