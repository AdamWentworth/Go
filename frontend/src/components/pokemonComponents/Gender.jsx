// Gender.jsx
import React, { useState, useEffect, useRef } from 'react';
import './Gender.css';

const Gender = ({
  pokemon, 
  gender: initialGenderProp = null,
  genderRate: genderRateProp,
  editMode = false,
  searchMode = false, // NEW: when true, behaves like GenderSearch
  onGenderChange,
}) => {
  // Extract values from pokemon if provided.
  const initialGender = pokemon ? pokemon.ownershipStatus.gender : initialGenderProp;
  const genderRate = pokemon ? pokemon.gender_rate : genderRateProp;

  const [gender, setGender] = useState(initialGender);
  const [availableGenders, setAvailableGenders] = useState([]);
  const didMount = useRef(false);

  // Parse genderRate into available genders.
  // In owned mode (searchMode false): 
  //    if both male and female are possible → ['Both', 'Male', 'Female'] 
  // In search mode:
  //    if both are possible → ['Any', 'Male', 'Female']
  const parseGenderRate = (rateStr) => {
    if (!rateStr) return [];
    const [maleRate, femaleRate, genderlessRate] = rateStr
      .split('_')
      .map(rate => parseInt(rate, 10) || 0);
    if (genderlessRate === 100) {
      return ['Genderless'];
    }
    if (maleRate > 0 && femaleRate > 0) {
      return searchMode 
        ? ['Any', 'Male', 'Female'] 
        : ['Both', 'Male', 'Female'];
    }
    if (maleRate > 0) {
      return ['Male'];
    }
    if (femaleRate > 0) {
      return ['Female'];
    }
    return [];
  };

  useEffect(() => {
    if (genderRate) {
      const genders = parseGenderRate(genderRate);
      setAvailableGenders(genders);
      if (!didMount.current) {
        // If only Genderless is available, set it and update the parent.
        if (genders.length === 1 && genders[0] === 'Genderless') {
          setGender('Genderless');
          onGenderChange && onGenderChange('Genderless');
        }
        // When no gender is set:
        else if (!initialGender && genders.length > 0) {
          // In search mode default to "Any", in owned mode default to "Both" if available.
          const defaultGender = searchMode
            ? (genders.includes('Any') ? 'Any' : genders[0])
            : (genders.includes('Both') ? 'Both' : genders[0]);
          setGender(defaultGender);
          onGenderChange && onGenderChange(defaultGender);
        } else {
          setGender(initialGender);
        }
        didMount.current = true;
      }
    }
  }, [genderRate, initialGender, onGenderChange, searchMode]);

  const toggleGender = () => {
    if (editMode && availableGenders.length > 1) {
      let togglable;
      if (searchMode) {
        // In search mode, cycle through all options (e.g., Any, Male, Female)
        togglable = availableGenders;
      } else {
        // In owned mode, if availableGenders includes "Both", remove it from the cycle.
        togglable = availableGenders.includes('Both')
          ? availableGenders.filter(g => g !== 'Both')
          : availableGenders;
      }
      const currentIndex = togglable.indexOf(gender);
      const nextIndex = (currentIndex + 1) % togglable.length;
      const newGender = togglable[nextIndex];
      setGender(newGender);
      onGenderChange && onGenderChange(newGender);
    }
  };

  const getGenderIconUrl = () => {
    // In search mode, "Any" shows the neutral icon.
    if (searchMode) {
      if (gender === 'Male') {
        return `${process.env.PUBLIC_URL}/images/male-icon.png`;
      } else if (gender === 'Female') {
        return `${process.env.PUBLIC_URL}/images/female-icon.png`;
      } else if (gender === 'Any') {
        return `${process.env.PUBLIC_URL}/images/neutral-icon.png`;
      }
    } else {
      // In owned mode, "Both" shows the neutral icon.
      if (gender === 'Male') {
        return `${process.env.PUBLIC_URL}/images/male-icon.png`;
      } else if (gender === 'Female') {
        return `${process.env.PUBLIC_URL}/images/female-icon.png`;
      } else if (gender === 'Both') {
        return `${process.env.PUBLIC_URL}/images/neutral-icon.png`;
      }
    }
    // For Genderless, return null so no icon is shown.
    return null;
  };

  const iconUrl = getGenderIconUrl();
  const isClickable = editMode && availableGenders.length > 1;

  // For Genderless-only Pokémon, or for searchMode with a default "neutral" state when not editable,
  // reserve the space.
  if ((availableGenders.length === 1 && availableGenders[0] === 'Genderless') ||
      (searchMode && gender === 'Any' && !editMode)) {
    return (
      <div className="gender-container" style={{ visibility: 'hidden' }}>
        {/* Reserved space */}
      </div>
    );
  }

  return (
    <div
      className="gender-container"
      onClick={isClickable ? toggleGender : undefined}
      role={isClickable ? 'button' : 'img'}
      aria-label={`Gender: ${gender}`}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
    >
      {iconUrl && (
        <img src={iconUrl} alt={gender} className="gender-icon" />
      )}
    </div>
  );
};

export default Gender;
