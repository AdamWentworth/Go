// OwnedInstance.jsx
import React, { useState } from 'react';
import './OwnedInstance.css';
import CPComponent from './OwnedComponents/CPComponent';
import NameComponent from './OwnedComponents/NameComponent';
import GenderComponent from './OwnedComponents/GenderComponent';

import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';

import MovesComponent from './OwnedComponents/MovesComponent';
import IVComponent from './OwnedComponents/IVComponent';

const OwnedInstance = ({ pokemon }) => {
  console.log(pokemon)
  return (
    <div>
      <CPComponent pokemon={pokemon} />
      <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" />
      <NameComponent pokemon={pokemon} />
      <GenderComponent pokemon={pokemon} />
      <div className="stats-container">
        <WeightComponent pokemon={pokemon} />
        <TypeComponent pokemon={pokemon} />
        <HeightComponent pokemon={pokemon} />
      </div>
      <div className="moves-content">
        <MovesComponent pokemon={pokemon} />
      </div>
      <IVComponent pokemon={pokemon} />
    </div>
  );
}

export default OwnedInstance;

