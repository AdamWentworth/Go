// OwnedInstance.jsx
import React, { useState } from 'react';
import './OwnedInstance.css';

import EditSaveComponent from './OwnedComponents/EditSaveComponent';
import CPComponent from './OwnedComponents/CPComponent';
import FavoriteComponent from './OwnedComponents/FavoriteComponent';
import FriendshipComponent from './OwnedComponents/FriendshipComponent';

import NameComponent from './OwnedComponents/NameComponent';

import LuckyComponent from './OwnedComponents/LuckyComponent';
import GenderComponent from './OwnedComponents/GenderComponent';

import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';

import MovesComponent from './OwnedComponents/MovesComponent';
import IVComponent from './OwnedComponents/IVComponent';

import LocationCaughtComponent from './OwnedComponents/LocationCaughtComponent';
import DateCaughtComponent from './OwnedComponents/DateCaughtComponent';

const OwnedInstance = ({ pokemon }) => {
  console.log("Initial Pokemon Data: ", pokemon);

  const [isLucky, setIsLucky] = useState(pokemon.ownershipStatus.lucky);
  const [editMode, setEditMode] = useState(false);

  const handleLuckyToggle = (newLuckyStatus) => {
    setIsLucky(newLuckyStatus);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  return (
    <div>
      <div className="top-row">
        <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        <CPComponent pokemon={pokemon} editMode={editMode} toggleEditMode={toggleEditMode} />
        <div className="right-stack">
          <FavoriteComponent pokemon={pokemon} editMode={editMode} />
          <FriendshipComponent pokemon={pokemon} />
        </div>
      </div>
      <div className="pokemon-image-container">
        {isLucky && <img src={process.env.PUBLIC_URL + '/images/lucky.png'} alt="Lucky Backdrop" className="lucky-backdrop" />}
        <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" />
      </div>
      <NameComponent pokemon={pokemon} editMode={editMode} />
      <div className="gender-lucky-row">
        {pokemon.ownershipStatus.shadow ? <div className="lucky-placeholder"></div> : (
          <LuckyComponent pokemon={pokemon} onToggleLucky={handleLuckyToggle} isLucky={isLucky} editMode={editMode} />
        )}
        <GenderComponent pokemon={pokemon} editMode={editMode} />
      </div>
      <div className="stats-container">
        <WeightComponent pokemon={pokemon} editMode={editMode} />
        <TypeComponent pokemon={pokemon} />
        <HeightComponent pokemon={pokemon} editMode={editMode} />
      </div>
      <div className="moves-content">
        <MovesComponent pokemon={pokemon} />
      </div>
      <IVComponent pokemon={pokemon} />
      <LocationCaughtComponent pokemon={pokemon} />
      <DateCaughtComponent pokemon={pokemon} />
    </div>
  );
}

export default OwnedInstance;

