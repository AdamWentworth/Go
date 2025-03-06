// TypeComponent.jsx
import React from 'react';
import './TypeComponent.css';

const TypeComponent = ({ pokemon }) => {
  const type1 = pokemon.type1_name;
  const type2 = pokemon.type2_name;
  const type1Icon = pokemon.type_1_icon;
  const type2Icon = pokemon.type_2_icon;

  return (
    <div className="type-container">
      <div className="type-icons">
        {type1 && <img src={type1Icon} alt={type1} className="type-icon" />}
        {type2 && <img src={type2Icon} alt={type2} className="type-icon" />}
      </div>
      <div className="type-label">
        {type1}{type2 ? ` / ${type2}` : ''}
      </div>
    </div>
  );
};

export default TypeComponent;
