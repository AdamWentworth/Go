// OwnedInstance.jsx
import React from 'react';
import './OwnedInstance.css';
import CPComponent from './OwnedComponents/CPComponent';
import NameComponent from './OwnedComponents/NameComponent';
import GenderComponent from './OwnedComponents/GenderComponent';

import MoveSelect from './OwnedComponents/MoveSelectComponent';
import TypeIcons from './OwnedComponents/TypeIcons';

const OwnedInstance = ({ pokemon }) => {

  return (
    <div>
      <CPComponent pokemon={pokemon} />
      <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" />
      <NameComponent pokemon={pokemon} />
      <GenderComponent pokemon={pokemon} />
      {/* <div className="stats-container">
        <EditableText label="Weight" field="weight" editMode={editMode.weight} value={stateValues.weight} onChange={(value) => setStateValues('weight', value)} toggleEdit={() => toggleEdit('weight')} />
        <TypeIcons pokemon={pokemon} />
        <EditableText label="Height" field="height" editMode={editMode.height} value={stateValues.height} onChange={(value) => setStateValues('height', value)} toggleEdit={() => toggleEdit('height')} />
      </div> */}

      {/* <MoveSelect label="Fast Move" field="fastMove" isFast={true} moves={pokemon.moves} selectedMove={stateValues.fastMove} onChange={(value) => setStateValues('fastMove', value)} />
      <MoveSelect label="Charged Moves" field="chargedMoves" isFast={false} moves={pokemon.moves} selectedMove={stateValues.chargedMoves} onChange={(value, index) => setStateValues('chargedMoves', value, index)} /> */}
    </div>
  );
}

export default OwnedInstance;
