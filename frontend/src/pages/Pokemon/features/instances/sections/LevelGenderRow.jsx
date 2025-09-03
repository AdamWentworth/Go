// sections/LevelGenderRow.jsx
import React from 'react';
import './LevelGenderRow.css';
import Level from '@/components/pokemonComponents/Level';
import Gender from '@/components/pokemonComponents/Gender';

const LevelGenderRow = ({
  pokemon,
  editMode,
  level,
  onLevelChange,
  errors,
  gender,
  onGenderChange,
}) => (
  <div className="level-gender-row">
    <Level
      pokemon={pokemon}
      editMode={editMode}
      level={level}
      onLevelChange={onLevelChange}
      errors={errors}
    />
    {(editMode || (gender !== null && gender !== '')) && (
      <div className="gender-wrapper">
        <Gender
          pokemon={pokemon}
          editMode={editMode}
          onGenderChange={onGenderChange}
        />
      </div>
    )}
  </div>
);

export default LevelGenderRow;