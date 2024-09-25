// GenderSearch.jsx
import React, { useEffect, useState } from 'react';
import './GenderSearch.css';

const GenderSearch = ({ genderRate, onGenderChange }) => {
  const [availableGenders, setAvailableGenders] = useState([]);
  const [selectedGender, setSelectedGender] = useState('Neutral');

  useEffect(() => {
    if (!genderRate) {
      // If genderRate is null or undefined, set empty genders
      setAvailableGenders([]);
      return;
    }

    // Remove letters and extract only numeric values
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
      setAvailableGenders([]); // If genderless, don't show the component
    } else {
      if (maleRate > 0) genders.push('Male');
      if (femaleRate > 0) genders.push('Female');
      setAvailableGenders(genders);
    }

    // Default to 'Neutral' if both genders are available
    setSelectedGender(genders.length === 2 ? 'Neutral' : genders[0]);
  }, [genderRate]);

  const toggleGender = () => {
    if (availableGenders.length === 2) {
      if (selectedGender === 'Neutral') {
        setSelectedGender('Male');
        onGenderChange('Male');
      } else if (selectedGender === 'Male') {
        setSelectedGender('Female');
        onGenderChange('Female');
      } else {
        setSelectedGender('Neutral');
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

  // Render the component even if there are no genders, to reserve space
  return (
    <div 
      className="gender-toggle-container" 
      onClick={toggleGender} 
      style={{ 
        cursor: availableGenders.length === 2 ? 'pointer' : 'default', 
        minHeight: '40px' // Ensure the space is always reserved
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