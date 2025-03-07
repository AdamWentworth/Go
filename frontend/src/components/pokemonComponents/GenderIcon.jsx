// GenderIcon.jsx

import React from 'react';
import './GenderIcon.css';

const GenderIcon = ({ gender }) => {
  const getGenderIconUrl = () => {
    if (gender === 'Male') {
      return `${process.env.PUBLIC_URL}/images/male-icon.png`;
    } else if (gender === 'Female') {
      return `${process.env.PUBLIC_URL}/images/female-icon.png`;
    } else {
      return null; // No icon for genderless or null
    }
  };

  const iconUrl = getGenderIconUrl();

  return iconUrl ? <img src={iconUrl} alt={gender} className="list-view-gender-icon" /> : null;
};

export default GenderIcon;
