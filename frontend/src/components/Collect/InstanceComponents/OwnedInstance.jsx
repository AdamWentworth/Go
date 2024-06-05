// OwnedInstance.jsx
import React from 'react';
import './OwnedInstance.css';
import CPComponent from './OwnedComponents/CPComponent';
import NameComponent from './OwnedComponents/NameComponent';
import GenderComponent from './OwnedComponents/GenderComponent';

import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';

import MoveSelect from './OwnedComponents/MoveSelectComponent';

const OwnedInstance = ({ pokemon }) => {

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
      {/* <MoveSelect label="Fast Move" field="fastMove" isFast={true} moves={pokemon.moves} selectedMove={stateValues.fastMove} onChange={(value) => setStateValues('fastMove', value)} />
      <MoveSelect label="Charged Moves" field="chargedMoves" isFast={false} moves={pokemon.moves} selectedMove={stateValues.chargedMoves} onChange={(value, index) => setStateValues('chargedMoves', value, index)} /> */}
    </div>
  );
}

export default OwnedInstance;
