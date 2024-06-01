import React from 'react';

const TypeIcons = ({ pokemon }) => {
  return (
    <div className="type-icons">
      <img src={process.env.PUBLIC_URL + pokemon.type_1_icon} alt={pokemon.type1_name} />
      <span>{pokemon.type1_name}</span>
      {pokemon.type_2_id && (
        <>
          <span> / </span>
          <img src={process.env.PUBLIC_URL + pokemon.type_2_icon} alt={pokemon.type2_name} />
          <span>{pokemon.type2_name}</span>
        </>
      )}
    </div>
  );
};

export default TypeIcons;
