// OwnedInstance.jsx
import React, { useState, useContext } from 'react';
import './OwnedInstance.css';

import { PokemonDataContext } from '../../../contexts/PokemonDataContext'; 

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
  // console.log("Initial Pokemon Data: ", pokemon);

  const { updateDetails } = useContext(PokemonDataContext);
  const [isLucky, setIsLucky] = useState(pokemon.ownershipStatus.lucky);
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);
  const [cp, setCP] = useState(pokemon.ownershipStatus.cp);

  const handleCPChange = (newCP) => {
    setCP(newCP);  // Update CP state
  };

  const handleLuckyToggle = (newLuckyStatus) => {
    setIsLucky(newLuckyStatus);
  };

  const handleNicknameChange = (newNickname) => {
    setNickname(newNickname);  // Update state with new nickname
  };

  const toggleEditMode = () => {
    if (editMode) {
      console.log("Saving changes...");
      updateDetails(pokemon.pokemonKey, { nickname: nickname, lucky: isLucky, cp: cp });
    }
    setEditMode(!editMode);
  };

  return (
    <div>
      <div className="top-row">
        <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        <CPComponent pokemon={pokemon} editMode={editMode} toggleEditMode={toggleEditMode} onCPChange={handleCPChange} />
        <div className="right-stack">
          <FavoriteComponent pokemon={pokemon} editMode={editMode} />
          <FriendshipComponent pokemon={pokemon} />
        </div>
      </div>
      <div className="pokemon-image-container">
        {isLucky && <img src={process.env.PUBLIC_URL + '/images/lucky.png'} alt="Lucky Backdrop" className="lucky-backdrop" />}
        <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" />
      </div>
      <NameComponent pokemon={pokemon} editMode={editMode} onNicknameChange={handleNicknameChange} />
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
        <MovesComponent pokemon={pokemon} editMode={editMode} />
      </div>
      <IVComponent pokemon={pokemon} editMode={editMode} />
      <LocationCaughtComponent pokemon={pokemon} editMode={editMode} />
      <DateCaughtComponent pokemon={pokemon} editMode={editMode} />
    </div>
  );
}

export default OwnedInstance;